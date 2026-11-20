// throw httpError(404, 'Post not found.') -> errorHandler replies { message } with status 404.
// Pass { fields: { title: '...' } } as extra to also send per-field messages for forms.
export const httpError = (status, message, extra = {}) =>
  Object.assign(new Error(message), { status, ...extra });
