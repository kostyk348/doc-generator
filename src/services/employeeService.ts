/**
 * Employee Service
 * Business logic layer for employee search, department lookup, and
 * automatic department code resolution for microservice integrations.
 */

import { TEPLOMASH_EMPLOYEES, TeplomashEmployee } from '../constants/teplomashEmployees';
import { DEPARTMENT_CODES, guessDepartmentCode } from '../constants/departmentCodes';

export class EmployeeService {
  /**
   * Search employees by query string (name, position, department)
   */
  public static searchEmployees(query: string): TeplomashEmployee[] {
    if (!query.trim()) return TEPLOMASH_EMPLOYEES;
    const lower = query.toLowerCase();
    return TEPLOMASH_EMPLOYEES.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(lower) ||
        emp.position.toLowerCase().includes(lower) ||
        emp.department.toLowerCase().includes(lower)
    );
  }

  /**
   * Resolve department code automatically based on department name and position.
   */
  public static resolveDepartmentCode(department: string, position: string): string {
    return guessDepartmentCode(department, position);
  }

  /**
   * Get all registered department codes with names and descriptions.
   */
  public static getDepartmentCodes() {
    return DEPARTMENT_CODES;
  }

  /**
   * Find a specific employee by name or position.
   */
  public static findEmployee(fullNameOrPosition: string): TeplomashEmployee | undefined {
    const lower = fullNameOrPosition.toLowerCase();
    return TEPLOMASH_EMPLOYEES.find(
      emp => emp.fullName.toLowerCase().includes(lower) || emp.position.toLowerCase().includes(lower)
    );
  }
}
