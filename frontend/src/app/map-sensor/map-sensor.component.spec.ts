import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapSensorComponent } from './map-sensor.component';

describe('MapSensorComponent', () => {
  let component: MapSensorComponent;
  let fixture: ComponentFixture<MapSensorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapSensorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapSensorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
