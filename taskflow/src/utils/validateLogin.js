const validateLogin = (form) => {
  const errors = {}
  if (!form.username) errors.username = 'Required'
  if (!form.password) errors.password = 'Required'
  return errors
}

export default validateLogin