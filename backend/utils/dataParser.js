// src/utils/dataParser.js
const logger = require('./logger');

/**
 * Parse government API response and normalize data
 * Handles string numbers and missing fields
 */
class DataParser {
  /**
   * Parse single district data entry from government API
   */
  parseDistrictData(apiData) {
    if (!apiData || typeof apiData !== 'object') {
      throw new Error('Invalid API data format');
    }

    // Extract and validate required fields
    const required = ['fin_year', 'month', 'state_code', 'state_name', 'district_code', 'district_name'];
    for (const field of required) {
      if (!apiData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Return normalized data structure
    return {
      district_code: String(apiData.district_code),
      district_name: String(apiData.district_name),
      state_code: String(apiData.state_code),
      state_name: String(apiData.state_name),
      fin_year: String(apiData.fin_year),
      month: String(apiData.month),
      
      // All government API fields (as strings)
      Approved_Labour_Budget: this.safeString(apiData.Approved_Labour_Budget),
      Average_Wage_rate_per_day_per_person: this.safeString(apiData.Average_Wage_rate_per_day_per_person),
      Average_days_of_employment_provided_per_Household: this.safeString(apiData.Average_days_of_employment_provided_per_Household),
      Differently_abled_persons_worked: this.safeString(apiData.Differently_abled_persons_worked),
      Material_and_skilled_Wages: this.safeString(apiData.Material_and_skilled_Wages),
      Number_of_Completed_Works: this.safeString(apiData.Number_of_Completed_Works),
      Number_of_GPs_with_NIL_exp: this.safeString(apiData.Number_of_GPs_with_NIL_exp),
      Number_of_Ongoing_Works: this.safeString(apiData.Number_of_Ongoing_Works),
      Persondays_of_Central_Liability_so_far: this.safeString(apiData.Persondays_of_Central_Liability_so_far),
      SC_persondays: this.safeString(apiData.SC_persondays),
      SC_workers_against_active_workers: this.safeString(apiData.SC_workers_against_active_workers),
      ST_persondays: this.safeString(apiData.ST_persondays),
      ST_workers_against_active_workers: this.safeString(apiData.ST_workers_against_active_workers),
      Total_Adm_Expenditure: this.safeString(apiData.Total_Adm_Expenditure),
      Total_Exp: this.safeString(apiData.Total_Exp),
      Total_Households_Worked: this.safeString(apiData.Total_Households_Worked),
      Total_Individuals_Worked: this.safeString(apiData.Total_Individuals_Worked),
      Total_No_of_Active_Job_Cards: this.safeString(apiData.Total_No_of_Active_Job_Cards),
      Total_No_of_Active_Workers: this.safeString(apiData.Total_No_of_Active_Workers),
      Total_No_of_HHs_completed_100_Days_of_Wage_Employment: this.safeString(apiData.Total_No_of_HHs_completed_100_Days_of_Wage_Employment),
      Total_No_of_JobCards_issued: this.safeString(apiData.Total_No_of_JobCards_issued),
      Total_No_of_Workers: this.safeString(apiData.Total_No_of_Workers),
      Total_No_of_Works_Takenup: this.safeString(apiData.Total_No_of_Works_Takenup),
      Wages: this.safeString(apiData.Wages),
      Women_Persondays: this.safeString(apiData.Women_Persondays),
      percent_of_Category_B_Works: this.safeString(apiData.percent_of_Category_B_Works),
      percent_of_Expenditure_on_Agriculture_Allied_Works: this.safeString(apiData.percent_of_Expenditure_on_Agriculture_Allied_Works),
      percent_of_NRM_Expenditure: this.safeString(apiData.percent_of_NRM_Expenditure),
      percentage_payments_gererated_within_15_days: this.safeString(apiData.percentage_payments_gererated_within_15_days),
      Remarks: this.safeString(apiData.Remarks),
      
      fetched_from: 'api',
      updated_at: new Date()
    };
  }

  /**
   * Parse array of district data
   */
  parseDistrictDataArray(apiDataArray) {
    if (!Array.isArray(apiDataArray)) {
      throw new Error('Expected array of district data');
    }

    const parsed = [];
    const errors = [];

    for (let i = 0; i < apiDataArray.length; i++) {
      try {
        parsed.push(this.parseDistrictData(apiDataArray[i]));
      } catch (error) {
        errors.push({ index: i, error: error.message });
        logger.warn(`Failed to parse data at index ${i}:`, error.message);
      }
    }

    return { parsed, errors };
  }

  /**
   * Convert string value to number safely
   */
  toNumber(value) {
    if (value === null || value === undefined || value === '' || value === 'NA') {
      return 0;
    }
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  }

  /**
   * Safely convert to string
   */
  safeString(value) {
    if (value === null || value === undefined) {
      return '0';
    }
    return String(value);
  }

  /**
   * Calculate numeric metrics from parsed data for analytics
   */
  calculateMetrics(data) {
    return {
      totalHouseholdsWorked: this.toNumber(data.Total_Households_Worked),
      totalIndividualsWorked: this.toNumber(data.Total_Individuals_Worked),
      totalExpenditure: this.toNumber(data.Total_Exp),
      averageWageRate: this.toNumber(data.Average_Wage_rate_per_day_per_person),
      averageDaysEmployment: this.toNumber(data.Average_days_of_employment_provided_per_Household),
      womenPersondays: this.toNumber(data.Women_Persondays),
      scPersondays: this.toNumber(data.SC_persondays),
      stPersondays: this.toNumber(data.ST_persondays),
      completedWorks: this.toNumber(data.Number_of_Completed_Works),
      ongoingWorks: this.toNumber(data.Number_of_Ongoing_Works),
      totalWorks: this.toNumber(data.Total_No_of_Works_Takenup),
      households100Days: this.toNumber(data.Total_No_of_HHs_completed_100_Days_of_Wage_Employment),
      
      // Calculated percentages
      womenParticipationRate: this.calculatePercentage(
        this.toNumber(data.Women_Persondays),
        this.toNumber(data.Persondays_of_Central_Liability_so_far)
      ),
      scParticipationRate: this.calculatePercentage(
        this.toNumber(data.SC_persondays),
        this.toNumber(data.Persondays_of_Central_Liability_so_far)
      ),
      stParticipationRate: this.calculatePercentage(
        this.toNumber(data.ST_persondays),
        this.toNumber(data.Persondays_of_Central_Liability_so_far)
      ),
      workCompletionRate: this.calculatePercentage(
        this.toNumber(data.Number_of_Completed_Works),
        this.toNumber(data.Total_No_of_Works_Takenup)
      )
    };
  }

  /**
   * Calculate percentage safely
   */
  calculatePercentage(numerator, denominator) {
    if (denominator === 0) return 0;
    return parseFloat(((numerator / denominator) * 100).toFixed(2));
  }

  /**
   * Format data for frontend consumption
   */
  formatForFrontend(dbData) {
    const metrics = this.calculateMetrics(dbData);
    
    return {
      // Basic info
      districtCode: dbData.district_code,
      districtName: dbData.district_name,
      stateCode: dbData.state_code,
      stateName: dbData.state_name,
      finYear: dbData.fin_year,
      month: dbData.month,
      
      // Raw data (all fields as strings for precise display)
      rawData: {
        Approved_Labour_Budget: dbData.Approved_Labour_Budget,
        Average_Wage_rate_per_day_per_person: dbData.Average_Wage_rate_per_day_per_person,
        Average_days_of_employment_provided_per_Household: dbData.Average_days_of_employment_provided_per_Household,
        Differently_abled_persons_worked: dbData.Differently_abled_persons_worked,
        Material_and_skilled_Wages: dbData.Material_and_skilled_Wages,
        Number_of_Completed_Works: dbData.Number_of_Completed_Works,
        Number_of_GPs_with_NIL_exp: dbData.Number_of_GPs_with_NIL_exp,
        Number_of_Ongoing_Works: dbData.Number_of_Ongoing_Works,
        Persondays_of_Central_Liability_so_far: dbData.Persondays_of_Central_Liability_so_far,
        SC_persondays: dbData.SC_persondays,
        SC_workers_against_active_workers: dbData.SC_workers_against_active_workers,
        ST_persondays: dbData.ST_persondays,
        ST_workers_against_active_workers: dbData.ST_workers_against_active_workers,
        Total_Adm_Expenditure: dbData.Total_Adm_Expenditure,
        Total_Exp: dbData.Total_Exp,
        Total_Households_Worked: dbData.Total_Households_Worked,
        Total_Individuals_Worked: dbData.Total_Individuals_Worked,
        Total_No_of_Active_Job_Cards: dbData.Total_No_of_Active_Job_Cards,
        Total_No_of_Active_Workers: dbData.Total_No_of_Active_Workers,
        Total_No_of_HHs_completed_100_Days_of_Wage_Employment: dbData.Total_No_of_HHs_completed_100_Days_of_Wage_Employment,
        Total_No_of_JobCards_issued: dbData.Total_No_of_JobCards_issued,
        Total_No_of_Workers: dbData.Total_No_of_Workers,
        Total_No_of_Works_Takenup: dbData.Total_No_of_Works_Takenup,
        Wages: dbData.Wages,
        Women_Persondays: dbData.Women_Persondays,
        percent_of_Category_B_Works: dbData.percent_of_Category_B_Works,
        percent_of_Expenditure_on_Agriculture_Allied_Works: dbData.percent_of_Expenditure_on_Agriculture_Allied_Works,
        percent_of_NRM_Expenditure: dbData.percent_of_NRM_Expenditure,
        percentage_payments_gererated_within_15_days: dbData.percentage_payments_gererated_within_15_days,
        Remarks: dbData.Remarks
      },
      
      // Calculated metrics (numbers for charts/graphs)
      metrics,
      
      // Metadata
      lastUpdated: dbData.updated_at,
      source: dbData.fetched_from
    };
  }

  /**
   * Validate state code format
   */
  isValidStateCode(stateCode) {
    return /^\d{1,2}$/.test(String(stateCode));
  }

  /**
   * Validate district code format
   */
  isValidDistrictCode(districtCode) {
    return /^\d{3,4}$/.test(String(districtCode));
  }
}

module.exports = new DataParser();