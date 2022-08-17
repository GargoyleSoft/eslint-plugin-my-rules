import {TSESTree} from '@typescript-eslint/typescript-estree'
import {TSESLint} from '@typescript-eslint/utils'
import {
    createRule,
    isArrayExpression,
    isArrowFunctionExpression,
    isCallExpression,
    isClassDeclaration,
    isIdentifier,
    isLiteral,
    isObjectExpression,
    isProperty
} from '../utils'

const isClassNameArrow = (expression: TSESTree.Node, className: string) => {
    if (!isArrowFunctionExpression(expression))
        return false

    if (expression.params.length !== 0 || !isIdentifier(expression.body) || expression.async)
        return false

    return expression.body.name === className
}

// Wants to find:  MakeButtonEnabledDialogProvider(() => __className__)
const isMakeButtonEnabledDialogProvider = (expression: TSESTree.Expression | TSESTree.SpreadElement, className: string) => {
    if (!isCallExpression(expression))
        return false
    else if (!(isIdentifier(expression.callee) && expression.callee.name === 'MakeButtonEnabledDialogProvider'))
        return false
    else if (expression.arguments.length !== 1)
        return false

    return isClassNameArrow(expression.arguments[0], className)
}

const getComponentDecoratorProperties = (decorator: TSESTree.Decorator): TSESTree.Property[] | null => {
    const expression = decorator.expression
    if (!isCallExpression(expression))
        return null

    if (expression.arguments.length > 1)
        return null

    const args = expression.arguments[0]
    if (!isObjectExpression(args))
        return null

    return args.properties as TSESTree.Property[]
}

const isProviderDictionary = (expression: TSESTree.Expression | TSESTree.SpreadElement) => {
    if (!isObjectExpression(expression))
        return false

    let provide = false
    let multi = false
    let useExisting = false

    for (const property of expression.properties) {
        if (!(isProperty(property) && isIdentifier(property.key)))
            continue

        switch (property.key.name) {
            case 'provide':
                if (!(isIdentifier(property.value) && property.value.name === 'BUTTON_ENABLED_DIALOG'))
                    return false

                provide = true

                break
            case 'useExisting':
                const value = property.value

                // It should be a forwardRef call expression
                if (!(isCallExpression(value) && isIdentifier(value.callee) && value.callee.name === 'forwardRef'))
                    return false

                if (!(value.arguments.length === 1 && isArrowFunctionExpression(value.arguments[0])))
                    return false

                useExisting = true

                break
            case 'multi':
                if (!(isLiteral(property.value) && property.value.raw === 'true'))
                    return false

                multi = true

                break
            default:
                break
        }
    }

    return provide && multi && useExisting
}

const rule = createRule({
    name: 'button-enabled-dialog',
    meta: {
        type: 'problem',
        docs: {
            description: 'force class injectables to be readonly if they are private/public/protected',
            recommended: 'error'
        },
        fixable: 'code',
        schema: [],
        messages: {
            buttonEnabledDialogRequiresComponent: 'IButtonEnabledDialog should only be implemented on Angular components.',
            buttonEnabledDialogProviderRequired: 'The component\'s providers should include the BUTTON_ENABLED_DIALOG token.'
        }
    },
    defaultOptions: [],
    create: (context: Readonly<TSESLint.RuleContext<'buttonEnabledDialogProviderRequired' | 'buttonEnabledDialogRequiresComponent', []>>) => {
        return {
            TSClassImplements(node: TSESTree.TSClassImplements): void {
                if (!isClassDeclaration(node.parent))
                    return

                const decorators = node.parent.decorators

                const componentDecorator = decorators
                    ? decorators.find(x => isCallExpression(x.expression) && isIdentifier(x.expression.callee) && x.expression.callee.name === 'Component')
                    : null

                if (!componentDecorator) {
                    context.report({
                        messageId: 'buttonEnabledDialogRequiresComponent',
                        node: node
                    })

                    return
                }

                const properties = getComponentDecoratorProperties(componentDecorator)

                // If this happens, they've already been given a compiler error, so just leave.
                if (!properties)
                    return

                const className = node.parent.id.name

                const makeProviderString = `MakeButtonEnabledDialogProvider(() => ${className})`

                const providersProperty = properties.find(x => isIdentifier(x.key) && x.key.name === 'providers')
                if (!providersProperty) {
                    const text = `,\n    providers: [${makeProviderString}]`

                    context.report({
                        messageId: 'buttonEnabledDialogProviderRequired',
                        node: componentDecorator,
                        fix: fixer => fixer.insertTextAfterRange(properties.at(-1).range, text)
                    })

                    return
                }

                // We have providers, make sure one of them is what we're looking for
                if (!isArrayExpression(providersProperty.value))
                    return

                let elements = providersProperty.value.elements

                if (elements.some(x => isProviderDictionary(x) || isMakeButtonEnabledDialogProvider(x, className)))
                    return

                context.report({
                    messageId: 'buttonEnabledDialogProviderRequired',
                    node: providersProperty,
                    fix: fixer => {
                        if (elements.length === 0)
                            return fixer.replaceText(providersProperty.value, `[${makeProviderString}]`)
                        else
                            return fixer.insertTextBeforeRange(elements[0].range, `${makeProviderString},\n    `)
                    }
                })
            }
        }
    }
})

export default rule