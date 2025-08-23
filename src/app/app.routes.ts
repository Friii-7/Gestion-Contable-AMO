import { Routes } from '@angular/router';
import { GestionContableComponent } from './components/gestion-contable/gestion-contable.component';
import { TablaGestionContableComponent } from './components/componente-tabla-editar-dialogo/tabla-gestion-contable';




export const routes: Routes = [
  {
    path: '',

    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: 'gestion-contable', component: GestionContableComponent },
      { path: 'tabla-gestion-contable', component: TablaGestionContableComponent },
    ]
  }
];
