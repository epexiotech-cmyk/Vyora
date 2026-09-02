import { DbTransaction } from '../repositories/BaseRepository';
import { companyRepository } from '../repositories/CompanyRepository';
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
      if (
        account &&
        account.companyId === companyId &&
        account.isActive &&
        (account.accountType === 'UPI' || account.qrEnabled)
      ) {
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
      if (
        account &&
        account.companyId === companyId &&
        account.isActive &&
        (account.accountType === 'UPI' || account.qrEnabled)
      ) {
        return account;
      }
    }

    const companyDefaultQr = paymentAccountRepository.getDefaultQrAccountSync(companyId, tx);
    return companyDefaultQr;
  }

  public resolveSignatureDestinationSync(customerId: string, companyId: string, tx: DbTransaction) {
    const customer = customerRepository.getByIdSync(customerId, companyId, tx);

    if (customer?.defaultSignatureId) {
      const signatures = companyRepository.getSignaturesSync(companyId, tx);
      const signature = signatures.find((s) => s.id === customer.defaultSignatureId);
      if (signature) {
        return signature;
      }
    }

    const signatures = companyRepository.getSignaturesSync(companyId, tx);
    const defaultSignature = signatures.find((s) => s.isDefault);
    if (defaultSignature) {
      return defaultSignature;
    }

    return signatures.length > 0 ? signatures[0] : null;
  }
}

export const paymentResolutionService = new PaymentResolutionService();
