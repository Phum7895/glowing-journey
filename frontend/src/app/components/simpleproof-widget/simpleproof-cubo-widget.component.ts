import { Component, Input, SecurityContext, SimpleChanges, OnChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ServicesApiServices } from '@app/services/services-api.service';
import { catchError, of } from 'rxjs';

export interface SimpleProofCubo {
  student_name: string;
  id_code: string;
  certificate_url: string;
  simpleproof_url: string;
  sanitized_certificate_url: SafeResourceUrl;
  sanitized_simpleproof_url: SafeResourceUrl;
}

@Component({
  selector: 'app-simpleproof-cubo-widget',
  templateUrl: './simpleproof-cubo-widget.component.html',
  styleUrls: ['./simpleproof-widget.component.scss'],
})
export class SimpleProofCuboWidgetComponent implements OnChanges {
  @Input() key: string = window['__env']?.customize?.dashboard.widgets?.find(w => w.component ==='simpleproof_cubo')?.props?.key ?? '';
  @Input() label: string = window['__env']?.customize?.dashboard.widgets?.find(w => w.component ==='simpleproof_cubo')?.props?.label ?? 'CUBO+ Certificates';
  @Input() widget: boolean = false;
  @Input() width = 300;
  @Input() height = 400;

  searchText: string = '';
  verified: SimpleProofCubo[] = [];
  filteredVerified: SimpleProofCubo[] = [];
  verifiedPage: SimpleProofCubo[] = [];
  isLoading: boolean = true;
  error: boolean = false;
  page = 1;
  lastPage = 1;
  itemsPerPage = 15;
  paginationMaxSize = window.innerWidth <= 767.98 ? 3 : 5;

  constructor(
    private servicesApiService: ServicesApiServices,
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadVerifications();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.widget) {
      this.itemsPerPage = this.widget ? 5 : 15;
    }
    if (changes.key) {
      this.loadVerifications();
    }
  }

  loadVerifications(): void {
    if (this.key) {
      this.isLoading = true;
      this.servicesApiService.getSimpleProofs$(this.key).pipe(
        catchError(() => {
          this.isLoading = false;
          this.error = true;
          return of({});
        }),
      ).subscribe((data: Record<string, SimpleProofCubo>) => {
        if (Object.keys(data).length) {
          this.verified = Object.keys(data).map(key => ({
            ...data[key],
            key,
            sanitized_certificate_url: data[key]['certificate_url']?.length ? this.sanitizer.bypassSecurityTrustResourceUrl(this.sanitizer.sanitize(SecurityContext.URL, data[key]['certificate_url']) ?? '') : null,
            sanitized_simpleproof_url: data[key]['simpleproof_url']?.length ? this.sanitizer.bypassSecurityTrustResourceUrl(this.sanitizer.sanitize(SecurityContext.URL, data[key]['simpleproof_url']) ?? '') : null,
          })).sort((a, b) => a.key.localeCompare(b.key));
          this.applyFilter();
          this.isLoading = false;
          this.error = false;
        }
      });
    }
  }

  applyFilter(event?: Event): void {
    let searchText = '';
    if (event) {
      searchText = (event.target as HTMLInputElement).value;
    }
    if (searchText?.length > 0) {
      this.filteredVerified = this.verified.filter(item =>
        item.student_name.toLowerCase().includes(searchText.toLowerCase()) || item.id_code.toLowerCase().includes(searchText.toLowerCase())
      );
    } else {
      this.filteredVerified = this.verified;
    }
    this.page = 1;
    this.updatePage();
  }

  updatePage(): void {
    this.verifiedPage = this.filteredVerified.slice((this.page - 1) * this.itemsPerPage, this.page * this.itemsPerPage);
  }

  pageChange(page: number): void {
    this.page = page;
    this.updatePage();
  }
}
