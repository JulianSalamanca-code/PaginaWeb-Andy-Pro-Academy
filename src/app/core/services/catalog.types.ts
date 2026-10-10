/**
 * Tipos del catálogo.
 *
 * Reexportan los tipos que genera openapi-typescript desde el OpenAPI de
 * la API en C#. Se centralizan aquí para que los componentes importen de
 * un lugar estable en vez del archivo generado, que se sobrescribe cada
 * vez que cambia el contrato.
 */
import type { components } from '../api/schema';

export type Course = components['schemas']['CourseDto'];
export type CourseSummary = components['schemas']['CourseSummaryDto'];
export type Service = components['schemas']['ServiceDto'];
export type ServiceSummary = components['schemas']['ServiceSummaryDto'];
export type ServiceWithAddOns = components['schemas']['ServiceWithAddOnsDto'];
export type AddOn = components['schemas']['AddOnDto'];
export type Product = components['schemas']['ProductDto'];
export type ProductVariant = components['schemas']['ProductVariantDto'];
export type Review = components['schemas']['ReviewDto'];
export type Faq = components['schemas']['FaqDto'];
export type Specialist = components['schemas']['SpecialistDto'];
export type HomeData = components['schemas']['HomeDataDto'];