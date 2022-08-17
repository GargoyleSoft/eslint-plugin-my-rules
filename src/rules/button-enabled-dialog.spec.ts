import {ESLintUtils} from '@typescript-eslint/utils'
import {InvalidTestCase} from '@typescript-eslint/utils/dist/ts-eslint'
import rule from './button-enabled-dialog'

const ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser'
})

const requireIndex = require("requireindex");
console.info(requireIndex('.'))

const makeProviderFromCall = (str: string, pre: boolean, post: boolean) => {
    if (pre)
        str = `{}, ${str}`

    if (post)
        str += ', {}'

    return `@Component({template:'', providers:[${str}]}) export class AppComponent implements IDialogButton {}`
}

const makeBadProvider = (pre: boolean, post: boolean, multi: boolean, useExisting: string | undefined = undefined): Errors => {
    let str = '@Component({template: "", providers: ['

    let existingBadProvider = '{provide: BUTTON_ENABLED_DIALOG'

    if (useExisting !== undefined)
        existingBadProvider += `,useExisting:${useExisting}`

    if (multi)
        existingBadProvider += `,multi:false`

    existingBadProvider += '}'

    if (pre)
        str += '{}, '

    str += existingBadProvider

    if (post)
        str += ', {}'

    str += ']}) export class AppComponent implements IDialogButton {}'

    let expected: string
    if (pre && post)
        expected = `@Component({template: "", providers: [MakeButtonEnabledDialogProvider(() => AppComponent),\n    {}, ${existingBadProvider}, {}]}) export class AppComponent implements IDialogButton {}`
    else if (pre)
        expected = `@Component({template: "", providers: [MakeButtonEnabledDialogProvider(() => AppComponent),\n    {}, ${existingBadProvider}]}) export class AppComponent implements IDialogButton {}`
    else if (pre || post)
        expected = `@Component({template: "", providers: [MakeButtonEnabledDialogProvider(() => AppComponent),\n    ${existingBadProvider}, {}]}) export class AppComponent implements IDialogButton {}`
    else
        expected = `@Component({template: "", providers: [MakeButtonEnabledDialogProvider(() => AppComponent),\n    ${existingBadProvider}]}) export class AppComponent implements IDialogButton {}`

    return {
        input: str,
        error: 'buttonEnabledDialogProviderRequired',
        expected: expected
    }
}

const makeProviderFromDictionary = (pre: boolean, post: boolean) => makeProviderFromCall('{provide:BUTTON_ENABLED_DIALOG,useExisting:forwardRef(() => AppComponent),multi:true}', pre, post)
const makeProviderFromHelper = (pre: boolean, post: boolean) => makeProviderFromCall('MakeButtonEnabledDialogProvider(() => AppComponent)', pre, post)

const validStatements = [
    makeProviderFromDictionary(false, false),
    makeProviderFromDictionary(true, false),
    makeProviderFromDictionary(false, true),
    makeProviderFromDictionary(true, true),
    makeProviderFromHelper(false, false),
    makeProviderFromHelper(true, false),
    makeProviderFromHelper(false, true),
    makeProviderFromHelper(true, true)
]

type Errors = {
    input: string,
    error: 'buttonEnabledDialogProviderRequired' | 'buttonEnabledDialogRequiresComponent',
    expected: string | undefined | null
}

const withHelper = '@Component({template: "",\n    providers: [MakeButtonEnabledDialogProvider(() => AppComponent)]}) export class AppComponent implements IDialogButton {}'
const withHelperOne = '@Component({template: "", providers: [MakeButtonEnabledDialogProvider(() => AppComponent),\n    {}]}) export class AppComponent implements IDialogButton {}'

const invalid: Errors[] = [
    {
        // Has to have a @Component
        input: 'export class AppComponent implements IDialogButton {}',
        error: 'buttonEnabledDialogRequiresComponent',
        expected: null
    },
    {
        // Has to have our provider
        input: '@Component({template: ""}) export class AppComponent implements IDialogButton {}',
        error: 'buttonEnabledDialogProviderRequired',
        expected: withHelper
    },
    {
        // An empty providers array is a special case
        input: '@Component({template: "", providers: []}) export class AppComponent implements IDialogButton {}',
        error: 'buttonEnabledDialogProviderRequired',
        expected: '@Component({template: "", providers: [MakeButtonEnabledDialogProvider(() => AppComponent)]}) export class AppComponent implements IDialogButton {}',
    },
    {
        // Has to have our provider
        input: '@Component({template: "", providers: [{}]}) export class AppComponent implements IDialogButton {}',
        error: 'buttonEnabledDialogProviderRequired',
        expected: withHelperOne
    },

    // Missing the multi field
    makeBadProvider(false, false, false, 'forwardRef(() => AppComponent)'),
    makeBadProvider(true, false, false, 'forwardRef(() => AppComponent)'),
    makeBadProvider(false, true, false, 'forwardRef(() => AppComponent)'),
    makeBadProvider(true, true, false, 'forwardRef(() => AppComponent)'),

    // Wrong useExisting value
    makeBadProvider(false, false, true, 'foo'),
    makeBadProvider(true, false, true, 'foo'),
    makeBadProvider(false, true, true, 'foo'),
    makeBadProvider(true, true, true, 'foo'),

    // Missing useExisting value
    makeBadProvider(false, false, true),
    makeBadProvider(true, false, true),
    makeBadProvider(false, true, true),
    makeBadProvider(true, true, true),
]

ruleTester.run('button-enabled-dialog', rule, {
    valid: validStatements,
    invalid: invalid.map(x => <InvalidTestCase<any, []>>{code: x.input, errors: [{messageId: x.error}], output: x.expected})
})