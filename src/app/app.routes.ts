import { Routes } from '@angular/router';
import { GestionContableComponent } from './components/gestion-contable/gestion-contable.component';



export const routes: Routes = [
  {
    path: '',

    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: 'gestion-contable', component: GestionContableComponent },
    ]
  }
];
