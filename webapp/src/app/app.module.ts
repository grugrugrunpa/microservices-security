import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppRoutes } from './app.routes';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ProductComponent } from './product/product.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { DataTablesModule } from 'angular-datatables';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { StatusComponent } from './status/status.component';
import { KeycloakAngularModule } from 'keycloak-angular';
import { AppInitService } from './app-init.service';
import { JsonDatePipe } from './product/json-date.pipe';
import { MaintenanceComponent } from './maintenance/maintenance.component';

const pipes = [
  /*JsonDatePipe*/
];

export function init(appInitService: AppInitService) {
  return () => appInitService.init();
}

@NgModule({
  declarations: [
    AppComponent,
    ProductComponent,
    HomeComponent,
    HeaderComponent,
    BreadcrumbComponent,
    SidebarComponent,
    StatusComponent,
    MaintenanceComponent,
    pipes
  ],
  imports: [
    BrowserModule,
    FormsModule,
    FontAwesomeModule,
    HttpClientModule,
    RouterModule.forRoot(AppRoutes),
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    CommonModule,
    BrowserAnimationsModule,
    NgChartsModule,
    DataTablesModule,
    ToastrModule.forRoot({
      maxOpened: 2,
      positionClass: 'toast-bottom-center',
      autoDismiss: true
    }),
    KeycloakAngularModule
  ],
  exports: pipes,
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: init,
      multi: true,
      deps: [AppInitService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
