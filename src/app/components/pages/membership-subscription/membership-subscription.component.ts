import {Component, OnInit} from '@angular/core';
import {Membership} from '../../../models/membership';
import {MembershipService} from '../../../services/membership.service';
import {Router} from '@angular/router';
import {AuthenticationService} from '../../../services/authentication.service';
import {User} from '../../../models/user';

@Component({
  selector: 'app-membership-subscription',
  templateUrl: './membership-subscription.component.html',
  styleUrls: ['./membership-subscription.component.scss']
})
export class MembershipSubscriptionComponent implements OnInit {

  menu = [
    {
      'name': 'Informations'
    },
    {
      'name': 'Vérification'
    },
    {
      'name': 'Confirmation'
    },
    {
      'name': 'Abonnement'
    },
    {
      'name': 'Résumé'
    },
    {
      'name': 'Paiement'
    }
  ];

  menuActive = 3;
  listMemberships: Membership[];
  selectedMembership: Membership = null;
  error: string;
  profile: User = null;

  constructor(private membershipService: MembershipService,
              private router: Router,
              private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this.profile = this.authenticationService.getProfile();
    this.refreshListMemberships();
  }

  refreshListMemberships() {
    this.membershipService.list().subscribe(
      memberships => {
        this.listMemberships = memberships.results.map(m => new Membership(m));
      }
    );
  }

  changeMembership(event) {
    for (const membership of this.listMemberships) {
      if (Number(event.target.value) === membership.id) {
        this.selectedMembership = membership;
      }
    }
  }

  submit() {
    if (this.selectedMembership) {
      localStorage.setItem('selectedMembership', JSON.stringify(this.selectedMembership));
      this.router.navigate(['/membership/summary']);
    } else {
      this.error = 'Vous devez séléctionnez le membership de votre choix.';
    }
  }

  membershipIsAvailable(membership) {
    console.log(membership);
    let haveRight = false;
    if (this.profile.academic_level) {
      haveRight = membership.academic_levels.indexOf(this.profile.academic_level.url);
    }
    const isForAll = membership.academic_levels.length === 0;
    console.log(membership);
    console.log(haveRight);
    console.log(isForAll);
    return haveRight || isForAll;
  }
}