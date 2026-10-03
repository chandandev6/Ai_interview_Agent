// History page ke upar: progress ek nazar me — KPI tiles, score trend, skill averages, mode wise
import { lazy, Suspense, useEffect, useState } from "react";
import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { getStats } from "../../api/interview.api.js";
import { CRITERIA, MODE_LABEL } from "../../constants/interview.js";

const ScoreTrendChart = lazy(() => import("./ScoreTrendChart.jsx"));

const ACCENT = "#2a78d6"; // chart jaisa hi — skill bars bhi same hue (magnitude = ek rang)

const card = "bg-white rounded-2xl border border-gray-200 p-5";

function StatTile({ label, value, suffix, delta }) {
    return (
        <div className={card}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-semibold mt-1">
                {value ?? "–"}
                {value !== null && value !== undefined && suffix && (
                    <span className="text-sm text-gray-400 font-normal">{suffix}</span>
                )}
            </p>
            {delta !== undefined && delta !== null && (
                // badhna achha hai → upar hara, neeche laal; icon + sign bhi (sirf rang par depend nahi)
                <p
                    className={`text-xs mt-1 flex items-center gap-1 ${
                        delta > 0 ? "text-green-700" : delta < 0 ? "text-red-700" : "text-gray-500"
                    }`}
                >
                    {delta > 0 ? <BsArrowUpRight /> : delta < 0 ? <BsArrowDownRight /> : null}
                    {delta > 0 ? "+" : ""}
                    {delta} vs previous
                </p>
            )}
        </div>
    );
}

function Analytics() {
    const [stats, setStats] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getStats()
            .then((res) => !cancelled && setStats(res.data))
            .catch(() => !cancelled && setFailed(true)); // analytics extra hai — fail ho to list to chalti rahe
        return () => {
            cancelled = true;
        };
    }, []);

    if (failed) return null;

    if (!stats) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
                {[0, 1, 2, 3].map((n) => (
                    <div key={n} className="h-28 bg-white rounded-2xl border border-gray-200" />
                ))}
            </div>
        );
    }

    const { summary, byMode, trend } = stats;
    if (summary.total === 0) return null; // abhi koi completed interview nahi — neeche wala empty state kaafi hai

    return (
        <section aria-label="Your progress" className="mb-10 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile label="Interviews completed" value={summary.total} />
                <StatTile label="Average score" value={summary.averageScore} suffix="/100" />
                <StatTile label="Best score" value={summary.bestScore} suffix="/100" />
                <StatTile label="Latest score" value={summary.latestScore} suffix="/100" delta={summary.change} />
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* trend */}
                <div className={`${card} lg:col-span-2`}>
                    <h2 className="font-semibold">Overall score over time</h2>
                    <p className="text-xs text-gray-500 mb-2">
                        Your last {trend.length} completed interview{trend.length === 1 ? "" : "s"}
                    </p>
                    {trend.length < 2 ? (
                        <p className="text-sm text-gray-500 py-16 text-center">
                            Complete one more interview to see your trend.
                        </p>
                    ) : (
                        <Suspense fallback={<div className="h-60 bg-gray-50 rounded-xl animate-pulse" />}>
                            <ScoreTrendChart trend={trend} />
                        </Suspense>
                    )}
                    {/* chart ka data table me bhi — screen reader / exact numbers ke liye */}
                    <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-gray-500 hover:text-black">View as table</summary>
                        <div className="overflow-x-auto mt-2">
                            <table className="w-full text-left text-xs">
                                <thead className="text-gray-500">
                                    <tr>
                                        <th className="py-1.5 pr-3 font-medium">Date</th>
                                        <th className="py-1.5 pr-3 font-medium">Role</th>
                                        <th className="py-1.5 pr-3 font-medium">Mode</th>
                                        <th className="py-1.5 font-medium text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="tabular-nums">
                                    {[...trend].reverse().map((point) => (
                                        <tr key={point._id} className="border-t border-gray-100">
                                            <td className="py-1.5 pr-3 whitespace-nowrap">
                                                {new Date(point.completedAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-1.5 pr-3">{point.role}</td>
                                            <td className="py-1.5 pr-3">{MODE_LABEL[point.mode]}</td>
                                            <td className="py-1.5 text-right">{point.overallScore}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </div>

                {/* skills */}
                <div className={card}>
                    <h2 className="font-semibold">Average skill scores</h2>
                    <p className="text-xs text-gray-500 mb-4">Across all completed interviews, out of 10</p>
                    <div className="space-y-4">
                        {CRITERIA.map(({ key, label }) => {
                            const value = summary.skills[key] ?? 0;
                            return (
                                <div key={key} title={`${label}: ${value} / 10`}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-gray-700">{label}</span>
                                        <span className="font-medium tabular-nums">{value}</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-r">
                                        <div
                                            className="h-full rounded-r"
                                            style={{ width: `${value * 10}%`, backgroundColor: ACCENT }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* sabse kamzor skill — "kya practice karun" ka seedha jawab */}
                    {(() => {
                        const weakest = CRITERIA.reduce((low, item) =>
                            (summary.skills[item.key] ?? 0) < (summary.skills[low.key] ?? 0) ? item : low,
                        );
                        return (
                            <p className="text-xs text-gray-500 mt-5">
                                Focus area: <span className="font-medium text-gray-800">{weakest.label}</span>
                            </p>
                        );
                    })()}
                </div>
            </div>

            {/* mode wise */}
            {byMode.length > 0 && (
                <div className={card}>
                    <h2 className="font-semibold mb-3">By interview mode</h2>
                    <div className="grid sm:grid-cols-3 gap-3">
                        {byMode.map((item) => (
                            <div key={item.mode} className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm font-medium">{MODE_LABEL[item.mode]}</p>
                                <p className="text-2xl font-semibold mt-1">
                                    {item.averageScore}
                                    <span className="text-xs text-gray-400 font-normal"> avg</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {item.count} interview{item.count === 1 ? "" : "s"} · best {item.bestScore}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default Analytics;
