import { Routes } from '@angular/router';
import { GestionContableComponent } from './components/gestion-contable/gestion-contable.component';
import { TablaGestionContableComponent } from './components/tabla-gestion-contable/tabla-gestion-contable.component';

export const routes: Routes = [
  { path: '', component: GestionContableComponent },
  { path: 'gestion-contable', component: GestionContableComponent },
  { path: 'tabla-gestion-contable', component: TablaGestionContableComponent },
  { path: '**', redirectTo: '' }
];
