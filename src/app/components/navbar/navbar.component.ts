import { Component, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  protected readonly isMenuOpen = signal(false);
  protected readonly currentRoute = signal('');

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.currentRoute.set(this.router.url);
    });
  }

  protected readonly navItems = signal([
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/gestion-contable', label: 'Gestión Contable', icon: '📊' },
    { path: '/ventas-dia', label: 'Ventas del Día', icon: '💰' },
    { path: '/tabla-ventas-dia', label: 'Tabla Ventas', icon: '📋' },
    { path: '/tabla-gestion-contable', label: 'Tabla Contable', icon: '📈' }
  ]);

  protected readonly isActiveRoute = computed(() => (path: string) => {
    return this.currentRoute() === path;
  });

  protected toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
