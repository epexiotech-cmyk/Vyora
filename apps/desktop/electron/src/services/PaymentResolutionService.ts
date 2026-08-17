import { DbTransaction } from '../repositories/BaseRepository';
import { customerRepository } from '../repositories/CustomerRepository';
import { paymentAccountRepository } from '../repositories/PaymentAccountRepository';

export class PaymentResolutionService {
  /**
   * Resolves the payment destination hierarchy for an invoice:
   * 1. Customer's defaultPaymentAccountId (if active and same company)
   * 2. Company's default BANK payment account (if active)
   * 3. Null
   */
  public async resolvePaymentDestination(customerId: string, companyId: string) {
    const customer = await customerRepository.getById(customerId, companyId);

    if (customer?.defaultPaymentAccountId) {
      const account = await paymentAccountRepository.getById(customer.defaultPaymentAccountId);
      if (account && account.companyId === companyId && account.isActive) {
        return account;
      }
    }

    // Fallback to Company default BANK account
    const companyDefault = await paymentAccountRepository.getDefaultBank(companyId);
    return companyDefault;
  }

  /**
   * Resolves the QR destination hierarchy for an invoice:
   * 1. Customer's defaultQrAccountId (if active, qrEnabled, and same company)
   * 2. Company's default QR payment account (if active and qrEnabled)
   * 3. Null
   */
  public async resolveQrDestination(customerId: string, companyId: string) {
    const customer = await customerRepository.getById(customerId, companyId);

    if (customer?.defaultQrAccountId) {
      const account = await paymentAccountRepository.getById(customer.defaultQrAccountId);
      if (account && account.companyId === companyId && account.isActive && account.qrEnabled) {
        return account;
      }
    }

    // Fallback to Company default QR-capable account
    const companyDefaultQr = await paymentAccountRepository.getDefaultQrAccount(companyId);
    return companyDefaultQr;
  }

  /**
   * Synchronous version for use inside transactions.
   */
  public resolvePaymentDestinationSync(customerId: string, companyId: string, tx: DbTransaction) {
    const customer = customerRepository.getByIdSync(customerId, companyId, tx);

    if (customer?.defaultPaymentAccountId) {
      const account = paymentAccountRepository.getByIdSync(customer.defaultPaymentAccountId, tx);
      if (account && account.companyId === companyId && account.isActive) {
        return account;
      }
    }

    const companyDefault = paymentAccountRepository.getDefaultBankSync(companyId, tx);
    return companyDefault;
  }

  public resolveQrDestinationSync(customerId: string, companyId: string, tx: DbTransaction) {
    const customer = customerRepository.getByIdSync(customerId, companyId, tx);

    if (customer?.defaultQrAccountId) {
      const account = paymentAccountRepository.getByIdSync(customer.defaultQrAccountId, tx);
      if (account && account.companyId === companyId && account.isActive && account.qrEnabled) {
        return account;
      }
    }

    const companyDefaultQr = paymentAccountRepository.getDefaultQrAccountSync(companyId, tx);
    return companyDefaultQr;
  }
}

export const paymentResolutionService = new PaymentResolutionService();
