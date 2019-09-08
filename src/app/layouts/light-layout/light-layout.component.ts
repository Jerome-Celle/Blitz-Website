import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-light-layout',
  template: `
      <div class="light-layout">
        <router-outlet></router-outlet>
      </div>
  `,
  styleUrls: ['light-layout.component.scss'],
})
export class LightLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}