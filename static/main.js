// UI ELEMENTS
const logoEl       = document.getElementById('logo')
const titleEl      = document.getElementById('title')
const inputEl      = document.getElementById('expression-inpt')
const stepsEl      = document.getElementById('steps')
const solutionEl   = document.getElementById('solution')
const errorEl      = document.getElementById('error')
const enterLabel   = document.getElementById('enter-label')
const stepTemplate = document.getElementById('step-template')

// STORES

// Steps store
const stepsStore = effector.createStore([])
// Processed expression store
const expressionStore = effector.createStore( getInitialExpression() )
// Current inputted expression
const currentExpressionStore = effector.createStore( getInitialExpression() )
// Boolean store for defining if enter tip should be dislayed
const needEnterTipStore = effector.combine(
    {
        expression: expressionStore,
        currentExpression: currentExpressionStore
    },
    ({ expression, currentExpression }) => !!currentExpression && currentExpression !== expression
)
// Store for displayed error
const shownErrorStore = effector.createStore('')

// EVENTS

// On input event
const userInputQueryEvent = effector.createEvent('user-input-query')
// stores ties
currentExpressionStore
    .on(userInputQueryEvent, (_, inputtedExpression) => inputtedExpression)

// On hit Enter event
const userUpdateQueryEvent = effector.createEvent('user-update-query')
// stores ties
expressionStore
    .on(userUpdateQueryEvent, (_, newExpression) => newExpression)

// On empty query event
const emptyQueryEvent = effector.createEvent('user-update-query')
// stores ties
stepsStore
    .on(emptyQueryEvent, () => [])

// EFFECTS

// Fetch results effect
const fetchExpressionEffect = effector.createEffect('fetch-expression')
// handler
    .use(async params => {
        const response = await fetch(`/expresso/steps?e=${ encodeURIComponent(params.expression) }`)
        
        if (response.status >= 400 && response.status < 500) {
            throw new Error('Запрос не был распознан, проверьте корректность выражения')
        } else if (response.status >= 500 && response.status < 600) {
            throw new Error('Внутренняя ошибка сервера, повторите попытку позже')
        }

        return await response.json() // steps
    })
// stores ties
stepsStore
    .on(fetchExpressionEffect.doneData, (_, steps) => [...steps])
    .on(fetchExpressionEffect.fail, () => [])
shownErrorStore
    .on(fetchExpressionEffect.fail, (_, { error }) => error.message)
    .on(fetchExpressionEffect.done, () => '')
// when triggered
expressionStore
    .watch(expression => {
        if(expression !== '') {
            // start fetching new solution
            fetchExpressionEffect({ expression })
        } else {
            // set steps to empty array
            emptyQueryEvent()
        }
    })

// UI BINDING

// Render components
stepsStore.watch(renderSteps)
shownErrorStore.watch(renderError)
expressionStore.watch(expression => {
    inputEl.value = expression

    // set routing things
    if(expression !== '') {
        window.history.pushState(null, null, `/expresso?e=${encodeURIComponent(expression)}`)
        titleEl.innerText = `${expression} — Экспрессо`
    } else {
        window.history.pushState(null, null, `/expresso`)
        titleEl.innerText = `Экспрессо`
    }
})
needEnterTipStore.watch(needEnterTip => {
    if(needEnterTip) {
        enterLabel.classList.add('enter-tip')
    } else {
        enterLabel.classList.remove('enter-tip')
    }
})

// Setting event listeners
inputEl.addEventListener('input', () => userInputQueryEvent(inputEl.value) )
inputEl.addEventListener('keypress', e => {
    if(e.key === 'Enter') {
        userUpdateQueryEvent( inputEl.value )
    }
})
enterLabel.addEventListener('click', () => userUpdateQueryEvent(inputEl.value) )
logoEl.addEventListener('click', () => window.location.href = '/expresso')

// FUNCTIONS

function getInitialExpression() {
    const urlParams = new URLSearchParams(window.location.search)
    const expressionEncoded = urlParams.get('e')

    return expressionEncoded !== null ? decodeURIComponent(expressionEncoded) : ''
}

function renderSteps(steps) {
    if(steps.length === 0) {
        solutionEl.innerHTML = ''
        stepsEl.innerHTML = ''

        return
    }

    const solutionCode = steps.length === 1 ?
        steps[0].expression : `${steps[0].expression} = ${steps[steps.length - 1].expression}`

    const solutionHtml = katex.renderToString(
        solutionCode,
        {
            throwOnError: false,
            maxSize: Infinity,
            displayMode: true
        }
    )

    solutionEl.innerHTML = solutionHtml

    // fragment of steps
    const stepsFragment = document.createDocumentFragment()

    // render steps
    steps.forEach(step => {
        // clone node
        const stepEl = document.importNode(stepTemplate.content, true)

        // get children
        const idEl   = stepEl.querySelector('.step-show-id')
        const descEl = stepEl.querySelector('.step-desc-p')
        const contEl = stepEl.querySelector('.step-show-content')

        // fill in content
        idEl.innerHTML   = '(' + step.step + ')'
        descEl.innerHTML = step.comment + ':'
        contEl.innerHTML = katex.renderToString(
            step.expression,
            {
                throwOnError: false,
                maxSize: Infinity,
                displayMode: true
            }
        )

        stepsFragment.appendChild(stepEl)
    })

    // clear steps
    stepsEl.innerHTML = ''
    stepsEl.appendChild(stepsFragment)
}

function renderError(error) {
    if(error === '') {
        errorEl.classList.add('hidden')
    } else {
        errorEl.classList.remove('hidden')
        errorEl.innerText = error
    }
}