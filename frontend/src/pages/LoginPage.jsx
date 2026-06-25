/**
 * LoginPage
 * Extracted from App.jsx lines 2090–2155
 */
import { useState } from 'react';
import { Database, AlertCircle } from 'lucide-react';

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (
            username.trim().toLowerCase() === 'firman karunia naibaho' &&
            password.trim() === '231402074'
        ) {
            onLogin({ namaPengisi: 'Firman Karunia Naibaho', nim: '231402074' });
        } else {
            setError('Username atau Password salah!');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <h2>
                        <Database size={24} style={{ display: 'inline', transform: 'rotate(-5deg)', marginRight: '8px' }} />
                        AKUISISI KEPLING
                    </h2>
                    <p>BPJS Ketenagakerjaan</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            background: 'var(--danger)', border: 'var(--border-thick)', boxShadow: 'var(--shadow-flat-sm)',
                            padding: '10px 12px', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)',
                            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', transform: 'rotate(-0.5deg)'
                        }}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="brutal-field" style={{ marginBottom: '20px' }}>
                        <label className="brutal-label" htmlFor="username" style={{ fontSize: '0.8rem' }}>Username</label>
                        <input
                            id="username" type="text" className="brutal-input" placeholder="Nama Pengguna"
                            value={username} onChange={(e) => setUsername(e.target.value)} required
                        />
                    </div>

                    <div className="brutal-field" style={{ marginBottom: '25px' }}>
                        <label className="brutal-label" htmlFor="password" style={{ fontSize: '0.8rem' }}>Password (NIM)</label>
                        <input
                            id="password" type="password" className="brutal-input" placeholder="NIM"
                            value={password} onChange={(e) => setPassword(e.target.value)} required
                        />
                    </div>

                    <button type="submit" className="brutal-btn login-btn">MASUK</button>
                </form>
            </div>
        </div>
    );
}
