import {TSESTree} from '@typescript-eslint/typescript-estree'
import {AST_NODE_TYPES, ESLintUtils} from '@typescript-eslint/utils'

export const createRule = ESLintUtils.RuleCreator(() => `https://github.com/gargoylesoft/eslint-plugin-gargoylesoft/blob/main/README.md`)

export const isClassDeclaration = (node: TSESTree.Node): node is TSESTree.ClassDeclarationWithName => node.type === AST_NODE_TYPES.ClassDeclaration
const isParameterProperty = (node: TSESTree.Node): node is TSESTree.TSParameterProperty => node.type === AST_NODE_TYPES.TSParameterProperty
const isMethodDefinition = (node: TSESTree.Node): node is TSESTree.MethodDefinition => node.type === AST_NODE_TYPES.MethodDefinition
const isFunctionExpression = (node: TSESTree.Node): node is TSESTree.FunctionExpression => node.type === AST_NODE_TYPES.FunctionExpression
export const isCallExpression = (node: TSESTree.Node): node is TSESTree.CallExpression => node.type === AST_NODE_TYPES.CallExpression
export const isObjectExpression = (node: TSESTree.Node): node is TSESTree.ObjectExpression => node.type === AST_NODE_TYPES.ObjectExpression
export const isProperty = (node: TSESTree.Node): node is TSESTree.Property => node.type === AST_NODE_TYPES.Property
export const isImplements = (node: TSESTree.Node): node is TSESTree.TSClassImplements => node.type === AST_NODE_TYPES.TSClassImplements
export const isIdentifier = (node: TSESTree.Node): node is TSESTree.Identifier => node.type === AST_NODE_TYPES.Identifier
export const isArrayExpression = (node: TSESTree.Node): node is TSESTree.ArrayExpression => node.type === AST_NODE_TYPES.ArrayExpression
export const isArrowFunctionExpression = (node: TSESTree.Node): node is TSESTree.ArrowFunctionExpression => node.type === AST_NODE_TYPES.ArrowFunctionExpression
export const isLiteral = (node: TSESTree.Node): node is TSESTree.Literal => node.type === AST_NODE_TYPES.Literal

export const isParameterPropertyReadonly = (node: TSESTree.Node) => isParameterProperty(node) && node.readonly

export function getClassDeclarationFromDecorator({parent}: TSESTree.Decorator): TSESTree.ClassDeclaration | null {
    return isClassDeclaration(parent) ? parent : null
}

export function getConstructorFromClassDeclaration({body}: TSESTree.ClassDeclaration): TSESTree.MethodDefinition | null {
    if (!body)
        return null

    const classElements: Array<TSESTree.ClassElement> = body.body

    if (!Array.isArray(classElements) || classElements.length === 0)
        return null

    const constructorMethodDefinition = classElements
        .filter(classElement => isMethodDefinition(classElement))
        .find(methodDefinition => (methodDefinition as TSESTree.MethodDefinition).kind === 'constructor')

    return constructorMethodDefinition && isMethodDefinition(constructorMethodDefinition) ? constructorMethodDefinition : null
}

export function getParameterPropertiesFromMethodDefinition({value}: TSESTree.MethodDefinition): TSESTree.TSParameterProperty[] {
    return isFunctionExpression(value) ? (value.params as TSESTree.TSParameterProperty[]).filter(isParameterProperty) : []
}