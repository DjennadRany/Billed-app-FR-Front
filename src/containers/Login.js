import { ROUTES_PATH } from '../constants/routes.js';

export let PREVIOUS_LOCATION = '';

export default class Login {
  constructor({ document, localStorage, onNavigate, store }) {
    this.document = document;
    this.localStorage = localStorage;
    this.onNavigate = onNavigate;
    this.store = store;

    this.formEmployee = document.querySelector(`form[data-testid="form-employee"]`);
    this.formEmployee.addEventListener("submit", this.handleSubmitEmployee);

    this.formAdmin = document.querySelector(`form[data-testid="form-admin"]`);
    this.formAdmin.addEventListener("submit", this.handleSubmitAdmin);
  }

  handleSubmitEmployee = (e) => {
    e.preventDefault();
    const user = this.getUserFromForm(e.target, 'Employee');
    this.processLogin(user, ROUTES_PATH.Bills);
  };

  handleSubmitAdmin = (e) => {
    e.preventDefault();
    const user = this.getUserFromForm(e.target, 'Admin');
    this.processLogin(user, ROUTES_PATH.Dashboard);
  };

  processLogin = (user, route) => {
    this.localStorage.setItem('user', JSON.stringify(user));
    this.login(user)
      .catch((err) => this.createUser(user))
      .then(() => {
        this.onNavigate(route);
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION;
        this.document.body.style.backgroundColor = '#fff';
      });
  };

  getUserFromForm = (form, type) => {
    return {
      type,
      email: form.querySelector(`input[data-testid="${type.toLowerCase()}-email-input"]`).value,
      password: form.querySelector(`input[data-testid="${type.toLowerCase()}-password-input"]`).value,
      status: 'connected',
    };
  };

  // Not necessary to cover these functions by tests
  login = (user) => {
    if (this.store) {
      return this.store.login(JSON.stringify(user)).then(({ jwt }) => {
        localStorage.setItem('jwt', jwt);
      });
    } else {
      return null;
    }
  };

  // Not necessary to cover these functions by tests
  createUser = (user) => {
    if (this.store) {
      return this.store
        .users()
        .create({
          data: JSON.stringify({
            type: user.type,
            name: user.email.split('@')[0],
            email: user.email,
            password: user.password,
          }),
        })
        .then(() => {
          console.log(`User with ${user.email} is created`);
          return this.login(user);
        });
    } else {
      return null;
    }
  };
}
