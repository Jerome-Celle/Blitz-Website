import { Component, OnInit } from '@angular/core';
import { Organization } from '../../../../models/organization';
import { OrganizationService } from '../../../../services/organization.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MyModalService } from '../../../../services/my-modal/my-modal.service';
import { NotificationsService } from 'angular2-notifications';
import { Router } from '@angular/router';

@Component({
  selector: 'app-organizations-page',
  templateUrl: './organizations-page.component.html',
  styleUrls: ['./organizations-page.component.scss']
})
export class OrganizationsPageComponent implements OnInit {

  listOrganizations: Organization[];

  organizationForm: FormGroup;
  organizationErrors: string[];
  selectedOrganizationUrl: string;

  settings = {
    clickable: true,
    addButton: true,
    editButton: true,
    removeButton: true,
    columns: [
      {
        name: 'name',
        title: 'Nom'
      }
    ]
  };

  constructor(private organizationService: OrganizationService,
              private myModalService: MyModalService,
              private notificationService: NotificationsService,
              private formBuilder: FormBuilder,
              private router: Router) { }

  ngOnInit() {
    this.refreshOrganizationList();

    this.organizationForm = this.formBuilder.group(
      {
        name: null
      }
    );
  }

  refreshOrganizationList() {
    this.organizationService.list().subscribe(
      organizations => {
        this.listOrganizations = organizations.results.map(o => new Organization(o));
      }
    );
  }

  OpenModalCreateOrganization() {
    this.organizationForm.reset();
    this.selectedOrganizationUrl = null;
    this.toogleModal('form_organizations', 'Ajouter une universite', 'Creer');
  }

  OpenModalEditOrganization(item) {
    this.organizationForm.controls['name'].setValue(item.name);
    this.selectedOrganizationUrl = item.url;
    this.toogleModal('form_organizations', 'Editer une universite', 'Editer');
  }

  submitOrganization() {
    if ( this.organizationForm.valid ) {
      if (this.selectedOrganizationUrl) {
        this.organizationService.update(this.selectedOrganizationUrl, this.organizationForm.value['name']).subscribe(
          data => {
            this.notificationService.success('Modifié');
            this.refreshOrganizationList();
            this.toogleModal('form_organizations');
          },
          err => {
            if (err.error.non_field_errors) {
              this.organizationErrors = err.error.non_field_errors;
              console.log(this.organizationErrors);
            }
            if (err.error.name) {
              this.organizationForm.controls['name'].setErrors({
                apiError: err.error.name
              });
            }
          }
        );
      } else {
        this.organizationService.create(this.organizationForm.value['name']).subscribe(
          data => {
            this.notificationService.success('Ajouté');
            this.refreshOrganizationList();
            this.toogleModal('form_organizations');
          },
          err => {
            if (err.error.non_field_errors) {
              this.organizationErrors = err.error.non_field_errors;
              console.log(this.organizationErrors);
            }
            if (err.error.name) {
              this.organizationForm.controls['name'].setErrors({
                apiError: err.error.name
              });
            }
          }
        );
      }
    }
  }

  removeOrganization(item) {
    this.organizationService.remove(item).subscribe(
      data => {
        this.notificationService.success('Supprimé', 'L\'université a bien été supprimé.');
        this.refreshOrganizationList();
      },
      err => {
        this.notificationService.error('Erreur', 'Echec de la tentative de suppression.');
      }
    );
  }

  toogleModal(name, title = '', button2 = '') {
    const modal = this.myModalService.get(name);

    if (!modal) {
      console.error('No modal named %s', name);
      return;
    }

    modal.title = title;
    modal.button2Label = button2;
    modal.toggle();
  }

  goToOrganization(event) {
    this.router.navigate(['/admin/organization/' + event.id]);
  }
}
