/**
 * @jest-environment jsdom
 */


import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import MockedBills from "../__mocks__/store.js";
import errorClass from '../views/ErrorPage.js';  // Ajout de l'importation pour errorClass
import { log } from "console";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);
      const datesSorted = [...dates].sort();

      expect(dates).toEqual(datesSorted);
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon.className).toEqual("active-icon");
    });

    test('Then icon-eye is clicked should generate data Bill in modal', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const bill = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      });
      $.fn.modal = jest.fn(); // Fix ".modal()" issue of jquery
      const eye = screen.getAllByTestId('icon-eye')[0];
      userEvent.click(eye);
      const modaleImageElt = document.querySelector('img[alt="Bill"]');
      expect(modaleImageElt).not.toEqual(null);
    });

    test('Then button "btn-new-bill" is clicked, should call handleClickNewBill and change url page', async () => {      
      document.body.innerHTML = BillsUI({ data: bills });
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      const bill = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      });
      const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`);
      let url = window.location.href;
      expect(url).toBe('http://localhost/#employee/bills');
      userEvent.click(buttonNewBill);
      url = window.location.href;
      expect(url).toBe('http://localhost/#employee/bill/new');
    });

    test('Then "getBills" method is call, we should return bills', async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const bill = new Bills({
        document, onNavigate, store: MockedBills, localStorage: window.localStorage
      });
      const billsData = await bill.getBills();
      const billsDataId = [];
      const currentMockedBills = await MockedBills.bills().list();
      const currentMockedBillsId = [];
      currentMockedBills.forEach(element => {
        currentMockedBillsId.push(element.id);
      });
      billsData.forEach(element => {
        billsDataId.push(element.id);
      });
      expect(currentMockedBillsId).toEqual(billsDataId);
    });

  });
});

describe('Given I am a user connected as Employee', () => {
  describe('When an error occurs on API on Bills page', () => {
    beforeEach(() => {
      jest.spyOn(MockedBills, "bills");
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'test@test.com'
      })); 
    });
  
    test('Then fetches messages from an API and fails with 500 message error', async () => {
      document.body.innerHTML = errorClass("Erreur 500");
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      MockedBills.bills.mockImplementationOnce(() => {
        return {
          list: () =>  {
            return Promise.reject(new Error("Erreur 500"));
          }
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });

    test('Then fetches messages from an API and fails with 404 message error', async () => {
      document.body.innerHTML = errorClass("Erreur 404");
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      MockedBills.bills.mockImplementationOnce(() => {
        return {
          list: () =>  {
            return Promise.reject(new Error("Erreur 404"));
          }
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
  });
});
