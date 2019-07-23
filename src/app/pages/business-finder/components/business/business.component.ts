import { Component, OnInit, Input } from '@angular/core';
import { Business } from 'src/app/interfaces/business';

@Component({
  selector: 'bf-business',
  templateUrl: './business.component.html',
  styleUrls: ['./business.component.scss'],
})
export class BusinessComponent implements OnInit {
  @Input() business:Business;

  constructor() { }

  ngOnInit() {}

}
