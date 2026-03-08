import React from 'react';
import { ProtectedLayout } from '../components/layout/ProtectedLayout';
import { Activity, Users, Ticket, Database } from 'lucide-react';

export const DashboardPage = () => {

    // Static dummy data for UI layout
    const stats = [
        { label: 'Total Active Tenants', value: '45', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Open Support Tickets', value: '12', icon: Ticket, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Database Health', value: '99.9%', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'System Load', value: '14%', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ];

    return (
        <ProtectedLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex justify-between items-end pb-4 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">System Health & Metrics</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mix-blend-multiply">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-6">Recent System Activity</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">New tenant registered: Abad Typing {item}</p>
                                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">2 Hours Ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-6">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors">
                                + Provision New Tenant
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors">
                                View Open Alerts
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors">
                                Database Backup Check
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </ProtectedLayout>
    );
};
