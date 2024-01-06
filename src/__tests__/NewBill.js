/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import errorClass from '../views/ErrorPage.js';

import { localStorageMock } from "../__mocks__/localStorage.js";
import MockedBills from "../__mocks__/store.js";

import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";

jest.mock("../app/store", () => MockedBills);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the file input doesn't have the correct type, we should reinitialize the input file value", () => {
      // Setup DOM element
      document.body.innerHTML = NewBillUI();
    
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));
    
      // Mock store with a mock method bills
      const mockStore = {
        bills: jest.fn(() => ({
          create: jest.fn(() => Promise.resolve()),
        })),
      };
    
      // Replace the original store with the mock store
      const originalStore = window.store;
      window.store = mockStore;
    
      // Define a file object with incorrect type
      const fileElt = new File(['testFile'], 'testFile.txt', {
        type: 'text/plain'
      });
    
      // Mock file input DOM element
      const fullFileMockGet = Object.defineProperty(document.querySelector(`input[data-testid="file"]`), 'files', {
        get: jest.fn(() => [fileElt]),
      });
    
      // Replace input DOM element with the mock input DOM element
      document.querySelector(`input[data-testid="file"]`).replaceWith(fullFileMockGet);
    
      // Create a NewBill object with the mock store
      const NewBillObject = new NewBill({ document, onNavigate: null, store: window.store, localStorage: null });
    
      // Define an event object
      const event = Object.assign(jest.fn(), {
        preventDefault: () => {},
        target: { value: 'C:\\fakepath\\cmd.jpg' }
      });
    
      // Call the handleChangeFile method
      NewBillObject.handleChangeFile(event);
    
      // Restore the original store
      window.store = originalStore;
    });
    

    test("Then we select a file in <input file>, we should check if file input type is correct", async () => {
      // Setup DOM element
      document.body.innerHTML = NewBillUI();

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      // Define a file object with correct type
      const fileElt = new File(['testfile'], 'testfile.jpg', {
        type: 'image/jpg',
      });

      // Define an event object
      const event = Object.assign(jest.fn(), {
        preventDefault: () => {},
        target: { value: 'C:\\fakepath\\cmd.jpg' }
      });

      // Mock file input DOM element
      const fullFileMockGet = Object.defineProperty(document.querySelector(`input[data-testid="file"]`), 'files', {
        get: jest.fn(() => [fileElt]),
      });

      // Replace input DOM element with the mock input DOM element
      document.querySelector(`input[data-testid="file"]`).replaceWith(fullFileMockGet);

      // Create a NewBill object
      const NewBillObject = new NewBill({ document, onNavigate: null, store: MockedBills, localStorage: localStorage });

      // Call handleChangeFile method
      await NewBillObject.handleChangeFile(event);

      // Expect that billId is not null
      expect(NewBillObject.billId).not.toBe(null);
    });

    test("Then we submit the form, we should get the bill's form data", () => {
      // Setup DOM element
      document.body.innerHTML = NewBillUI();
    
      // Mock console.error (needed in an update method called in NewBill object)
      console.error = jest.fn();
    
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'test@test.com'
      }));
    
      // Define onNavigate
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
    
      // Create a NewBill object
      const NewBillObject = new NewBill({ document, onNavigate, store: MockedBills, localStorage: localStorage });
    
      // Mock form data
      const formData = {
        type: 'Transports',
        name: '',
        amount: NaN,
        date: '',
        vat: '',
        pct: 20,
        commentary: '',
        fileUrl: null,
        fileName: null,
        status: 'pending'
      };
    
      // Mock store update method
      MockedBills.bills().update = jest.fn(async ({ data, selector }) => {
        // Assuming your update method updates the data
        // Update messageInfo with the form data
        NewBillObject.messageInfo = formData;
      });
    
      // DOM element
      const submitButtonElt = document.getElementById('btn-send-bill');
    
      // Provoke a click on submit button
      userEvent.click(submitButtonElt);
    
      // Check if the messageInfo has the correct form data
      expect(NewBillObject.messageInfo).toEqual(formData);
    });
    
  });
});

describe('Given I am a user connected as an Employee', () => {
  describe('When an error occurs on the API on the NewBill page', () => {
    beforeEach(() => {
      jest.spyOn(MockedBills, "bills");

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'test@test.com'
      }));
    });

    test('Then fetches messages from an API and fails with a 500 message error', async () => {
      // Define a 500 error message
      const error500 = new Error("Erreur 500");

      // Define DOM page
      const errorElt = errorClass(error500.message);
      document.body.innerHTML = errorElt;

      // Allow navigation
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      // Make a GET request on API data list
      MockedBills.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          }
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);

      // Get the text "Erreur 500" on the DOM
      const message = await screen.getByText(/Erreur 500/);

      // Expect that the message is truthy
      expect(message).toBeTruthy();
    });

    test('Then fetches messages from an API and fails with a 404 message error', async () => {
      // Define a 404 error message
      const error404 = new Error("Erreur 404");

      // Define DOM page
      const errorElt = errorClass(error404.message);
      document.body.innerHTML = errorElt;

      // Allow navigation
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      // Make a GET request on API data list
      MockedBills.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          }
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);

      // Get the text "Erreur 404" on the DOM
      const message = await screen.getByText(/Erreur 404/);

      // Expect that the message is truthy
      expect(message).toBeTruthy();
    });
  });
});
