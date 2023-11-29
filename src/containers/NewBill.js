import { ROUTES_PATH } from '../constants/routes.js';
import Logout from './Logout.js';

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
    formNewBill.addEventListener('submit', this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener('change', this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = async (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;

    // Déclarez dates comme une variable locale
    const dates = [];

    formData.append("file", file);
    formData.append("email", email);

    try {
        const { fileUrl, key } = await this.store.bills().create({
            data: formData,
            headers: {
                noContentType: true,
            },
        });

        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = fileName;

        // Ajoutez cette ligne pour mettre à jour `dates`
        dates.push(new Date().toISOString().slice(0, 10));

        // Tri des dates dans l'ordre chronologique
        await this.sortDatesChronologically();

        // Reste du code...
    } catch (error) {
        console.error(error);
    }
};


  sortDatesChronologically() {
    return this.getBillsDates().then((dates) => {
        dates = [...new Set(dates)]; // Remove duplicates
        dates.sort((a, b) => new Date(a) - new Date(b));
        this.document.querySelector(`input[data-testid="datepicker"]`).value = dates.join(',');
    });
}


  getBillsDates() {
    return this.store
      .bills()
      .list()
      .then((snapshot) => {
        return snapshot.map((doc) => doc.date);
      });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem('user')).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending',
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH['Bills']);
  };

  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills']);
        })
        .catch((error) => console.error(error));
    }
  };
}
