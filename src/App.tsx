import React, { useState } from 'react';

export default function CreditCalculator() {
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(36);
  const [rrso, setRrso] = useState(10);
  const [schedule, setSchedule] = useState<
    {
      month: number;
      payment: number;
      interest: number;
      capital: number;
      remaining: number;
    }[]
  >([]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculate = () => {
    const convertedAmount = amount.toString();
    const convertedMonths = months.toString();
    const convertedRrso = rrso.toString();
    const principal = parseFloat(convertedAmount);
    const rate = parseFloat(convertedRrso) / 100 / 12; // miesięczne oprocentowanie
    const n = parseInt(convertedMonths);

    if (!principal || !rate || !n) return;

    // wzór na ratę annuitetową
    const monthlyPayment =
      (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);

    let remaining = principal;
    const scheduleData = [];

    for (let i = 1; i <= n; i++) {
      const interest = remaining * rate;
      const capital = monthlyPayment - interest;
      remaining -= capital;
      scheduleData.push({
        month: i,
        payment: monthlyPayment,
        interest,
        capital,
        remaining: remaining > 0 ? remaining : 0,
      });
    }

    setSchedule(scheduleData);
  };

  const totalPaid = schedule.reduce((sum, r) => sum + r.payment, 0);
  const totalInterest = totalPaid - amount;

  return (
    <div className="flex justify-center w-dvw">
      <div className="max-w-2xl mx-auto p-6 bg-gray rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Kalkulator kredytu (RRSO)
        </h1>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold">Kwota (zł)</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Okres (mies.)</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">RRSO (%)</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={rrso}
              onChange={(e) => setRrso(Number(e.target.value))}
            />
          </div>
        </div>

        <button
          onClick={calculate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full mb-6"
        >
          Oblicz
        </button>

        {schedule.length > 0 && (
          <div>
            <div className="mb-4 text-center">
              <p className="font-semibold">
                Miesięczna rata: {formatNumber(schedule[0].payment)} zł
              </p>
              <p>Całkowity koszt: {formatNumber(totalPaid)} zł</p>
              <p>Odsetki: {formatNumber(totalInterest)} zł</p>
            </div>

            <table className="w-full text-sm border-t">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-2">Miesiąc</th>
                  <th className="p-2">Rata</th>
                  <th className="p-2">Kapitał</th>
                  <th className="p-2">Odsetki</th>
                  <th className="p-2">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.month} className="border-t text-center">
                    <td className="p-2">{row.month}</td>
                    <td className="p-2">{formatNumber(row.payment)}</td>
                    <td className="p-2">{formatNumber(row.capital)}</td>
                    <td className="p-2">{formatNumber(row.interest)}</td>
                    <td className="p-2">{formatNumber(row.remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
