const validateRegister = (form) => {
  const errors = {}

  if (!form.username) errors.username = 'Required'
  else if (form.username.length > 10) errors.username = 'Max 10 characters'

  if (!form.password) errors.password = 'Required'

  if (!form.firstName) errors.firstName = 'Required'
  else if (form.firstName.length > 20) errors.firstName = 'Max 20 characters'

  if (!form.lastName) errors.lastName = 'Required'
  else if (form.lastName.length > 20) errors.lastName = 'Max 20 characters'

  if (!form.email) errors.email = 'Required'
  else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email'
  else if (form.email.length > 100) errors.email = 'Max 100 characters'

  return errors
}

export default validateRegister