import BaseModel from './baseModel';
import { Country } from './country';
import { StateProvince } from './stateProvince';

export class Workplace extends BaseModel {
  url: string;
  id: number;
  name: string;
  name_fr: string;
  name_en: string;
  details: string;
  details_fr: string;
  details_en: string;
  seats: string;
  address_line1: string;
  address_line2: string;
  address_line1_fr: string;
  address_line2_fr: string;
  address_line1_en: string;
  address_line2_en: string;
  postal_code: string;
  city: string;
  city_fr: string;
  city_en: string;
  country: string;
  country_fr: string;
  country_en: string;
  state_province: string;
  state_province_fr: string;
  state_province_en: string;
  timezone: string;
  pictures: string[];

  getAddress() {
    let string = this.address_line1 + ', ';
    if (this.address_line2) {
      string += this.address_line2 + ', ';
    }
    string += this.city + ', ';
    string += this.state_province + ' ';
    string += this.postal_code + ', ';
    string += this.country;
    return string;
  }
}

