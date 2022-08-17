import {TSESTree} from '@typescript-eslint/typescript-estree'
import {TSESLint} from '@typescript-eslint/utils'
import {
    createRule,
    getClassDeclarationFromDecorator,
    getConstructorFromClassDeclaration,
    getParameterPropertiesFromMethodDefinition, isParameterPropertyReadonly
} from '../utils'


// From https://astexplorer.net/
export const ANY_ANGULAR_CLASS_DECORATOR =
    'ClassDeclaration > Decorator:matches(' +
    ['Component', 'Directive', 'Pipe', 'Injectable'].map(x => `[expression.callee.name="${x}"]`).join(', ') +
    ')'

const rule = createRule({
    name: 'readonly-injectables',
    meta: {
        type: 'problem',
        docs: {
            description: 'force class injectables to be readonly if they are private/public/protected',
            recommended: 'error'
        },
        fixable: 'code',
        schema: [],
        messages: {
            readonlyInjectablesRequired: 'The class injectables should be declared with keyword "readonly" if they are private/protected/public.'
        }
    },
    defaultOptions: [],
    create: (context: Readonly<TSESLint.RuleContext<'readonlyInjectablesRequired', []>>) => {
        return {
            [ANY_ANGULAR_CLASS_DECORATOR](node: TSESTree.Decorator): void {
                const classDeclaration = getClassDeclarationFromDecorator(node)
                const constructor = getConstructorFromClassDeclaration(classDeclaration)

                if (!constructor)
                    return

                getParameterPropertiesFromMethodDefinition(constructor)
                    .filter(x => !isParameterPropertyReadonly(x))
                    .map(x => context.report({
                        messageId: 'readonlyInjectablesRequired',
                        loc: x.loc,
                        fix: fixer => [fixer.insertTextBefore(x.parameter, 'readonly ')]
                    }))
            }
        }
    }
})

export default rule