export function createMockCompany(overrides = {}) {
  return {
    id: 'comp_1',
    name: 'Test Company',
    gstin: '27AADCB2230M1Z2',
    stateCode: '27',
    ...overrides,
  };
}

export function createMockCustomer(overrides = {}) {
  return {
    id: 'cust_1',
    name: 'Test Customer',
    gstin: '27AADCB2230M1Z2',
    stateCode: '27',
    ...overrides,
  };
}

export function createMockProduct(overrides = {}) {
  return {
    id: 'prod_1',
    name: 'Test Product',
    price: 100,
    ...overrides,
  };
}

export function createMockTax(overrides = {}) {
  return {
    id: 'tax_1',
    name: 'GST 18%',
    rate: 18,
    ...overrides,
  };
}
