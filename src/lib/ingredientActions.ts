export const INGREDIENT_RECIPE_EVENT = 'yeodong:ingredient-recipes'

export function requestIngredientRecipes(ingredientId: string) {
  window.dispatchEvent(
    new CustomEvent<{ ingredientId: string }>(INGREDIENT_RECIPE_EVENT, {
      detail: { ingredientId },
    }),
  )
}
