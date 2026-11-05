import mongoose from 'mongoose';
import User from '../db/models/user.js';
import WalletTransaction from '../db/models/walletTransaction.js';
import Withdrawal from '../db/models/withdrawl.js';
import { getWalletSummary } from '../services/wallet.service.js';



const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));


const maskAccountNumber = (accountNumber = '') => {
  const digits = String(accountNumber).replace(/\D/g, '');
  return digits.slice(-4);
};


export const getPaymentOverview = async (req, res) => {
  try {
    const userId = toObjectId(req.user?.id?.userId);
    const [user, summary, transactions, withdrawals] = await Promise.all([
      User.findById(userId).select('payoutDetails'),
      getWalletSummary(userId),
      WalletTransaction.find({ userId }).sort({ createdAt: -1 }).limit(15),
      Withdrawal.find({ userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      payoutDetails: user?.payoutDetails || {},
      wallet: summary,
      transactions,
      withdrawals,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const updatePayoutDetails = async (req, res) => {
  try {
    const { accountHolderName, bankName, accountNumber, ifsc, upiId } = req.body;

    if (!accountHolderName || (!accountNumber && !upiId)) {
      return res.status(400).json({ message: 'Account holder and a bank account or UPI ID are required' });
    }

    const payoutDetails = {
      accountHolderName: String(accountHolderName).trim(),
      accountHolder: String(accountHolderName).trim(),
      bankName: bankName || '',
      accountLast4: accountNumber ? maskAccountNumber(accountNumber) : '',
      ifsc: ifsc || '',
      IFSC: ifsc || '',
      upiId: upiId || '',
      isComplete: Boolean(accountHolderName && (accountNumber || upiId)),
      updatedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      req.user?.id?.userId,
      { payoutDetails },
      { new: true }
    ).select('payoutDetails');

    res.json({ message: 'Payout details saved', payoutDetails: user.payoutDetails });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const requestWithdrawal = async (req, res) => {
  try {
    const userId = toObjectId(req.user?.id?.userId);
    const amount = Math.round(Number(req.body.amount || 0));
    const user = await User.findById(userId).select('payoutDetails');

    if (!user?.payoutDetails?.isComplete) {
      return res.status(400).json({ message: 'Add payout details before requesting a withdrawal' });
    }

    const summary = await getWalletSummary(userId);
    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Withdrawal amount must be at least 100 paise' });
    }

    if (amount > summary.available) {
      return res.status(400).json({ message: 'Withdrawal amount exceeds available balance' });
    }

    const withdrawal = await Withdrawal.create({
      userId,
      amount,
      payoutSnapshot: {
        accountHolderName: user.payoutDetails.accountHolderName || user.payoutDetails.accountHolder,
        bankName: user.payoutDetails.bankName || '',
        accountLast4: user.payoutDetails.accountLast4 || '',
        ifsc: user.payoutDetails.ifsc || user.payoutDetails.IFSC || '',
        upiId: user.payoutDetails.upiId || '',
      },
    });

    try {
      await WalletTransaction.create({
        userId,
        withdrawalId: withdrawal._id,
        type: 'withdrawal_hold',
        amount,
        status: 'pending',
        description: 'Withdrawal requested',
      });
    } catch (ledgerError) {
      await Withdrawal.deleteOne({ _id: withdrawal._id });
      throw ledgerError;
    }

    res.status(201).json({ message: 'Withdrawal requested', withdrawal });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
