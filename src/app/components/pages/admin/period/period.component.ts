import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MyModalService } from '../../../../services/my-modal/my-modal.service';
import { Period } from '../../../../models/period';
import { PeriodService } from '../../../../services/period.service';
import { TimeSlot } from '../../../../models/timeSlot';
import { TimeSlotService } from '../../../../services/time-slot.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { isNull } from 'util';
import {MyNotificationService} from '../../../../services/my-notification/my-notification.service';

@Component({
  selector: 'app-period',
  templateUrl: './period.component.html',
  styleUrls: ['./period.component.scss']
})
export class PeriodComponent implements OnInit {

  alertMessage = 'Si vous modifier ce bloc de rédaction toutes les ' +
    'réservations déja effectué seront annulé et remboursé et ' +
    'un message d\'explication sera envoyé aux membres ayant ' +
    'subit une annulation.';

  period: Period;
  listTimeslots: TimeSlot[];
  listAdaptedTimeslots: any[];

  timeslotForm: FormGroup;
  timeslotErrors: string[];
  selectedTimeslot: any = null;

  settings = {
    title: 'Liste des blocs de rédaction:',
    noDataText: 'Aucun bloc de rédaction pour le moment',
    addButton: true,
    editButton: true,
    removeButton: true,
    clickable: true,
    previous: false,
    next: false,
    numberOfPage: 0,
    page: 0,
    columns: [
      {
        name: 'start_time',
        title: 'Date de début'
      },
      {
        name: 'end_time',
        title: 'Date de fin'
      },
      {
        name: 'display_reservations',
        title: 'Nombre de reservations'
      }
    ]
  };

  timeslotInDeletion: any = null;
  securityOnDeletion: false;
  messageOnDeletion = '';

  limitChoices = [10, 20, 100, 1000];
  limit = 20;
  page = 1;

  displayOnlyFutureTimeslot = true;

  constructor(private periodService: PeriodService,
              private myModalService: MyModalService,
              private notificationService: MyNotificationService,
              private formBuilder: FormBuilder,
              private timeslotService: TimeSlotService,
              private activatedRoute: ActivatedRoute,
              private router: Router) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.periodService.get(params['id']).subscribe(
        period => {
          this.period = new Period(period);
          this.refreshTimeslotList();
        }
      );
    });
    this.resetForm();
  }

  resetForm(edit = false) {
    if (edit) {
      this.timeslotForm = this.formBuilder.group(
        {
          start_time: null,
          end_time: null,
          period: null,
          price: 1,
          force_update: false,
          custom_message: null
        }
      );
    } else {
      this.timeslotForm = this.formBuilder.group(
        {
          start_time: null,
          end_time: null,
          period: null,
          price: 1,
        }
      );
    }
  }

  refreshTimeslotList(onlyFuture = this.displayOnlyFutureTimeslot, page = this.page, limit = this.limit) {
    this.resetTimeslotData();
    const filters: {name: string, value: any}[] = [
      {
        'name': 'period',
        'value': this.period.id
      }
    ];

    if (onlyFuture) {
      filters.push({
        'name': 'end_time__gte',
        'value': new Date().toISOString(),
      });
    }

    this.timeslotService.list(filters, limit, limit * (page - 1), 'start_time').subscribe(
      timeslots => {
        this.settings.numberOfPage = Math.ceil(timeslots.count / limit);
        this.settings.page = page;
        this.settings.previous = !isNull(timeslots.previous);
        this.settings.next = !isNull(timeslots.next);

        this.listTimeslots = timeslots.results.map(t => new TimeSlot(t));
        this.listAdaptedTimeslots = [];
        for (const timeslot of this.listTimeslots) {
          this.listAdaptedTimeslots.push(this.timeslotAdapter(timeslot));
        }
      }
    );
  }

  OpenModalCreateTimeslot() {
    this.resetForm();
    this.timeslotForm.controls['period'].setValue(this.period.url);
    this.selectedTimeslot = null;
    this.toggleModal('form_timeslots', 'Ajouter une plage horaire', 'Créer');
  }

  OpenModalEditTimeslot(item) {
    this.resetForm(true);
    for (const timeslot of this.listTimeslots) {
      if (timeslot.id === item.id) {
        this.timeslotForm.controls['start_time'].setValue(timeslot.start_time);
        this.timeslotForm.controls['end_time'].setValue(timeslot.end_time);
        this.timeslotForm.controls['period'].setValue(this.period.url);
      }
    }
    this.selectedTimeslot = item;
    this.toggleModal('form_timeslots', 'Éditer une plage horaire', 'Éditer');
  }

  submitTimeslot() {
    if ( this.timeslotForm.valid ) {
      const value = this.timeslotForm.value;
      if (isNull(value.custom_message)) {
        delete value['custom_message'];
      }
      if (this.selectedTimeslot) {
        if (this.selectedTimeslot.number_of_reservations > 0 && value.force_update === false) {
          this.timeslotForm.controls['force_update'].setErrors({
            apiError: ['Vous devez comprendre les répercutions de cet acte avant de valider!']
          });
        } else {
          this.timeslotService.update(this.selectedTimeslot.url, value).subscribe(
            data => {
              this.notificationService.success('shared.notifications.commons.updated.title');
              this.refreshTimeslotList();
              this.toggleModal('form_timeslots');
            },
            err => {
              if (err.error.non_field_errors) {
                this.timeslotErrors = err.error.non_field_errors;
              }
              if (err.error.start_time) {
                this.timeslotForm.controls['start_time'].setErrors({
                  apiError: err.error.start_time
                });
              }
              if (err.error.end_time) {
                this.timeslotForm.controls['end_time'].setErrors({
                  apiError: err.error.end_time
                });
              }
            }
          );
        }
      } else {
        this.timeslotService.create(value).subscribe(
          data => {
            this.notificationService.success('shared.notifications.commons.added.title');
            this.refreshTimeslotList();
            this.toggleModal('form_timeslots');
          },
          err => {
            if (err.error.non_field_errors) {
              this.timeslotErrors = err.error.non_field_errors;
            }
            if (err.error.start_time) {
              this.timeslotForm.controls['start_time'].setErrors({
                apiError: err.error.start_time
              });
            }
            if (err.error.end_time) {
              this.timeslotForm.controls['end_time'].setErrors({
                apiError: err.error.end_time
              });
            }
          }
        );
      }
    }
  }

  removeTimeslot(item = null, force = false) {
    if (!item && !this.timeslotInDeletion) {
      console.error('No one timeslot given in argument');
    } else {
      if (item) {
        this.timeslotInDeletion = item;
      }
      if (this.timeslotInDeletion.number_of_reservations > 0 && !force) {
        this.toggleModal('validation_deletion', 'Attention!', 'Rembourser & Contacter');
      } else {
        this.timeslotService.remove(this.timeslotInDeletion, force, this.messageOnDeletion).subscribe(
          data => {
            this.notificationService.success('shared.notifications.delete_bloc.title', 'shared.notifications.delete_bloc.content');
            this.refreshTimeslotList();
          },
          err => {
            this.notificationService.error('shared.notifications.fail_deletion.title', 'shared.notifications.fail_deletion.content');
          }
        );
      }
    }
  }

  toggleModal(name, title = '', button2 = '') {
    const modal = this.myModalService.get(name);

    if (!modal) {
      console.error('No modal named %s', name);
      return;
    }

    modal.title = title;
    modal.button2Label = button2;
    modal.toggle();
  }

  timeslotAdapter(timeslot) {
    return {
      id: timeslot.id,
      url: timeslot.url,
      start_time: timeslot.getStartDay() + ' - ' + timeslot.getStartTime(),
      end_time: timeslot.getStartDay() + ' - ' + timeslot.getEndTime(),
      display_reservations: timeslot.reservations.length + ' / ' + timeslot.workplace.seats,
      number_of_reservations: timeslot.reservations.length
    };
  }

  goToTimeslot(event) {
    this.router.navigate(['/admin/timeslot/' + event.id]);
  }

  changePage(index: number) {
    this.page = index;
    this.refreshTimeslotList();
  }

  changeLimit(newLimit) {
    this.limit = newLimit;
    this.page = 1;
    this.refreshTimeslotList();
  }

  isSecurityOnDeletionValid() {
    return this.securityOnDeletion;
  }

  setDisplayOnlyFutureTimeslot(value) {
    this.displayOnlyFutureTimeslot = value;
    this.refreshTimeslotList();
  }

  resetTimeslotData() {
    this.listAdaptedTimeslots = null;
    this.listTimeslots = null;
  }
}
