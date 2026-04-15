import { useState, useEffect } from 'react';

interface ScheduleRow {
  month: number;
  payment: number;
  interest: number;
  capital: number;
  remaining: number;
}

interface ValidationErrors {
  amount?: string;
  months?: string;
  rrso?: string;
  overpayment?: string;
}

type Theme = 'light' | 'dark';

export default function CreditCalculator() {
  const [amount, setAmount] = useState<number>(10000);
  const [months, setMonths] = useState<number>(36);
  const [rrso, setRrso] = useState<number>(10);
  const [overpayment, setOverpayment] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (amount <= 0) {
      newErrors.amount = 'Kwota musi być większa od 0';
    } else if (amount > 10000000) {
      newErrors.amount = 'Maksymalna kwota to 10 000 000 zł';
    }

    if (months <= 0) {
      newErrors.months = 'Okres musi być większy od 0';
    } else if (months > 600) {
      newErrors.months = 'Maksymalny okres to 600 miesięcy';
    }

    if (rrso < 0) {
      newErrors.rrso = 'RRSO nie może być ujemne';
    } else if (rrso > 100) {
      newErrors.rrso = 'RRSO nie może przekraczać 100%';
    }

    if (overpayment < 0) {
      newErrors.overpayment = 'Nadpłata nie może być ujemna';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculate = () => {
    if (!validate()) return;

    const overpaymentValue = overpayment;
    const principal = amount;
    const rate = rrso / 100 / 12;
    const n = months;

    if (principal <= 0 || n <= 0) return;

    let monthlyPayment: number;
    if (rate === 0) {
      monthlyPayment = principal / n;
    } else {
      monthlyPayment =
        (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    }

    let remaining = principal;
    const scheduleData: ScheduleRow[] = [];

    for (let i = 1; i <= n && remaining > 0; i++) {
      const interest = remaining * rate;
      const capital = Math.min(
        remaining,
        Math.max(monthlyPayment + overpaymentValue - interest, 0)
      );
      const payment = interest + capital;
      remaining -= capital;
      scheduleData.push({
        month: i,
        payment,
        interest,
        capital,
        remaining: remaining > 0 ? remaining : 0,
      });
    }

    setSchedule(scheduleData);

    const totalPaidCalc = scheduleData.reduce((sum, r) => sum + r.payment, 0);
    const totalInterestCalc = totalPaidCalc - principal;

    setTotalPaid(totalPaidCalc);
    setTotalInterest(totalInterestCalc);
  };

  const exportToCSV = () => {
    if (schedule.length === 0) return;

    const headers = ['Miesiąc', 'Rata', 'Kapitał', 'Odsetki', 'Saldo'];
    const rows = schedule.map((row) => [
      row.month,
      row.payment.toFixed(2),
      row.capital.toFixed(2),
      row.interest.toFixed(2),
      row.remaining.toFixed(2),
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `harmonogram-kredytu-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-200'} flex justify-center items-start py-8`}>
      <div className={`max-w-2xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md w-full mx-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-2xl font-bold text-center flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Kalkulator kredytu (RRSO)
          </h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-yellow-500' : 'bg-gray-600'} text-white`}
            aria-label="Zmień motyw"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="amount" className={`block text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Kwota (zł)</label>
            <input
              id="amount"
              type="number"
              className={`border p-2 rounded w-full ${errors.amount ? 'border-red-500' : 'border-gray-300'} ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label htmlFor="months" className={`block text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Okres (mies.)</label>
            <input
              id="months"
              type="number"
              className={`border p-2 rounded w-full ${errors.months ? 'border-red-500' : 'border-gray-300'} ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            />
            {errors.months && <p className="text-red-500 text-xs mt-1">{errors.months}</p>}
          </div>
          <div>
            <label htmlFor="rrso" className={`block text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>RRSO (%)</label>
            <input
              id="rrso"
              type="number"
              step="0.01"
              className={`border p-2 rounded w-full ${errors.rrso ? 'border-red-500' : 'border-gray-300'} ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
              value={rrso}
              onChange={(e) => setRrso(Number(e.target.value))}
            />
            {errors.rrso && <p className="text-red-500 text-xs mt-1">{errors.rrso}</p>}
          </div>
          <div>
            <label htmlFor="overpayment" className={`block text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              Nadpłata (zł)
            </label>
            <input
              id="overpayment"
              type="number"
              className={`border p-2 rounded w-full ${errors.overpayment ? 'border-red-500' : 'border-gray-300'} ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
              value={overpayment}
              onChange={(e) => setOverpayment(Number(e.target.value))}
            />
            {errors.overpayment && <p className="text-red-500 text-xs mt-1">{errors.overpayment}</p>}
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
              <p className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Miesięczna rata: {formatNumber(schedule[0].payment)} zł
              </p>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Całkowity koszt: {formatNumber(totalPaid)} zł</p>
              <p className="font-bold text-red-600">Odsetki: {formatNumber(totalInterest)} zł</p>
            </div>

            <div className="flex justify-end mb-2">
              <button
                onClick={exportToCSV}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              >
                📥 Eksportuj CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-t">
                <thead>
                  <tr className={theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-slate-700 text-white'}>
                    <th className="p-2">Miesiąc</th>
                    <th className="p-2">Rata</th>
                    <th className="p-2">Kapitał</th>
                    <th className="p-2">Odsetki</th>
                    <th className="p-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.month} className={`border-t ${theme === 'dark' ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
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
          </div>
        )}
      </div>
    </div>
  );
}
