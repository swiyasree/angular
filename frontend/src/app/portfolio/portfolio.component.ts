import { Component, OnInit } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'bootstrap';
import { Stock} from './test';

// Fallback implementation of sessionStorage
const sessionStorage = typeof window !== 'undefined' ? window.sessionStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

@Component({
  selector: 'app-portfolio',
  standalone: true, 
  imports: [NgClass, MatInputModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, NgIf, HttpClientModule, CommonModule, TransactionDialogComponent, NgbModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})

export class PortfolioComponent implements OnInit {

  portfolioData: any = [];
  currentAmount: any;
  balanceAmount: any;
  quantityOfStock: any;
  combinedData: any;
  buysellmodal: any;
  boughtSymbol: string = '';
  soldSymbol: string = '';
  isMobileView: boolean = false;
  quantity: number = 0;
  total: number = 0;
  totalPrice = 0;
  notEnoughStocks: boolean = false;
  totalExceedsBalance: boolean = false;
  item: any;
  dataLoaded: boolean = false;
  newportfolioData: any;
  ticker: any;
  dictionary: { [key: string]: Stock } = {};
  company: any;
  currentPrice: any;
  calcCost: any;
  buysellaction: any;
  currentQuantity: any;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit() {
    this.checkMobileView();
    this.fetchCurrentBalance();
    this.fetchPortfolioData();
  }
  checkMobileView() {
    this.isMobileView = window.innerWidth <= 768;
  }

  closeboughtMessage() {
    this.boughtSymbol = '';
  }

  closesoldMessage() {
    this.soldSymbol = '';
  }

  isAllStocksQuantityOneOrLess(): boolean {
    return this.portfolioData.every((item: { quantity: number; }) => item.quantity <= 0);
  }

  fetchPortfolioData() {
    this.http.get<any>('https://stocksearchon.azurewebsites.net/portfolio').subscribe(
      (data) => {
        
        this.portfolioData = data;
        
        for (const item of this.portfolioData) 
        {
          this.dictionary[item.symbol] = item;
          this.currentQuantity = item.quantity;
        }
      },

      (error) => {
        console.error('Error fetching portfolio data:', error);
      }
    );
  }

  fetchtickerData(symbolticker: string) {
    return this.http.get<any>(`https://stocksearchon.azurewebsites.net/?ticker=${symbolticker}`);
  }

  fetchCurrentBalance() {
    this.http.get<any>('https://stocksearchon.azurewebsites.net/currentBalance').subscribe(
      (data) => {
        this.currentAmount = data.currentAmount;
        this.quantityOfStock = data.quantity;
      },
      (error) => {
        console.error('Error fetching current balance:', error);
      }
    );
  }

  buyStock(symbolticker: string, action: string) {
    this.buysellaction = action;
    this.ticker = this.dictionary[symbolticker].symbol;
    this.currentPrice = this.dictionary[symbolticker].currentPrice;

    if (!symbolticker) 
    {
      console.error("Ticker value is required");
      return;
    }
  }

  sellStock(symbolticker: string, action: string) 
  {
    this.buysellaction = action;
    this.ticker = this.dictionary[symbolticker].symbol;
    this.currentPrice = this.dictionary[symbolticker].currentPrice;

    if (!symbolticker) {
      console.error("Ticker value is required");
      return;
    }
  }

  async sell(symbolticker : string) 
  {
    this.soldSymbol = symbolticker;
    if (this.quantity <= 0) {
      return;
    }

  
    const requestData = {
      company: this.dictionary[symbolticker].company,
      quantity: -this.quantity,
      total: this.total, 
      totalPrice: -this.totalPrice,
      avgPrice: this.totalPrice/this.quantity,
      currentPrice: this.dictionary[symbolticker].currentPrice,
      marketPrice: -(this.dictionary[symbolticker].currentPrice * this.quantity),
      symbol: this.dictionary[symbolticker].symbol
    };

  
    try {
      await this.http.post<any>('https://stocksearchon.azurewebsites.net/portfolio', requestData).toPromise();
      // Code to execute after successful POST
    } catch (error) {
      console.error('Error selling:', error);
    }
    this.fetchPortfolioData();
  }
  
  async buy(symbolticker: string) 
  {
    this.boughtSymbol = symbolticker;
    if (this.quantity <= 0) {
      // Handle invalid quantity
      return;
    }
      const totalCost = this.calcCost * this.quantity;
      if (totalCost > this.currentAmount) {
        this.dialog.closeAll();
        return;
      }
    
      const requestData = {
        company: this.dictionary[symbolticker].company,
        quantity: this.quantity,
        total: -totalCost, 
        totalPrice: totalCost,
        avgPrice: totalCost / this.quantity,
        currentPrice: this.dictionary[symbolticker].currentPrice,
        marketPrice: this.dictionary[symbolticker].currentPrice * this.quantity,
        symbol: this.dictionary[symbolticker].symbol
      };
      
      try {
        await this.http.post<any>('https://stocksearchon.azurewebsites.net/portfolio', requestData).toPromise();
        // Code to execute after successful POST
      } catch (error) {
        console.error('Error buying:', error);
      }
      this.fetchPortfolioData();
  }

    checkTotal(symbolticker: string) 
    {
      const totalCost = this.dictionary[symbolticker].currentPrice * this.quantity;
      this.calcCost = this.dictionary[symbolticker].currentPrice;
      this.totalExceedsBalance = totalCost > this.currentAmount;
      this.notEnoughStocks = this.currentQuantity < this.quantity;
    }

    getTotal() 
    {
      this.total = this.calcCost * this.quantity;
      this.totalPrice = this.calcCost * this.quantity;
      return this.total;
    }

}