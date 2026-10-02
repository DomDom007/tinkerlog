// Tinkerlog: a journal for maker projects that turns into a portfolio for university and scholarship applications.
import { useEffect, useState } from "react";
import { idbGet, idbSet, shrinkImage } from "./lib/idb";
import { uid, useStored } from "./lib/store";
import { prettyDate, todayISO } from "./lib/time";
import { Section, Stat, Stats } from "./ui/kit";

const T = "tinkerlog";
type Entry = { id: string; date: string; did: string; problem: string; fix: string; hours: number; photo: boolean };
type Project = { id: string; title: string; goal: string; status: "idea" | "building" | "done"; skills: string[]; entries: Entry[]; reflection: string };
const SKILLS = ["Electronics", "Soldering", "Arduino", "3D printing", "CAD", "Woodwork", "Coding", "Python", "Sewing", "Robotics", "Design", "Testing", "Teamwork"];
const SAMPLE: Project[] = [{
  id: "p1", title: "Plant watering robot", goal: "Water my grandmother's balcony plants automatically when the soil is dry.", status: "building", skills: ["Arduino", "Electronics", "Coding", "3D printing"], reflection: "",
  entries: [
    { id: "e1", date: "2026-08-30", did: "Wired a soil moisture sensor to an Arduino Uno and printed the readings.", problem: "Readings jumped around a lot.", fix: "Averaged 10 readings and moved the sensor away from the pot edge.", hours: 3, photo: false },
    { id: "e2", date: "2026-09-06", did: "Added a 5 V pump with a relay and a water tank from an old bottle.", problem: "The Arduino reset every time the pump started.", fix: "Powered the pump separately and added a diode across the motor.", hours: 4, photo: false },
    { id: "e3", date: "2026-09-20", did: "Designed and 3D printed a case in Tinkercad.", problem: "First print warped at the corners.", fix: "Added a brim and slowed the first layer.", hours: 5, photo: false },
  ],
}];

function Photo({ id }: { id: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => { idbGet(`${T}:${id}`).then(v => setSrc(v ?? "")); }, [id]);
  return src ? <img src={src} alt="" className="tk-photo" /> : null;
}

export default function Tinkerlog() {
  const [me, setMe] = useStored(T, "me", { name: "Yassine Ben Salem", school: "Lycée Pilote Ariana", year: "Year 12" });
  const [projects, setProjects] = useStored<Project[]>(T, "projects", SAMPLE);
  const [openId, setOpenId] = useState(projects[0]?.id ?? "");
  const [view, setView] = useState<"log" | "portfolio">("log");
  const [e, setE] = useState({ did: "", problem: "", fix: "", hours: "2" });
  const [file, setFile] = useState<File | null>(null);
  const p = projects.find(x => x.id === openId) ?? projects[0];
  const set = (patch: Partial<Project>) => setProjects(projects.map(x => (x.id === p.id ? { ...x, ...patch } : x)));
  const hours = projects.reduce((a, x) => a + x.entries.reduce((b, y) => b + y.hours, 0), 0);
  const problems = projects.reduce((a, x) => a + x.entries.filter(y => y.problem).length, 0);
  const allSkills = [...new Set(projects.flatMap(x => x.skills))];
  const addEntry = async (ev: React.FormEvent) => {
    ev.preventDefault(); if (!e.did.trim()) return;
    const id = uid(); let photo = false;
    if (file) { await idbSet(`${T}:${id}`, await shrinkImage(file, 1000)); photo = true; }
    set({ entries: [...p.entries, { id, date: todayISO(), did: e.did.trim(), problem: e.problem, fix: e.fix, hours: parseFloat(e.hours) || 0, photo }] });
    setE({ did: "", problem: "", fix: "", hours: "2" }); setFile(null);
  };

  return (
    <div className="stack">
      <Section title="Your maker record" aside={<div className="seg-mini"><button aria-pressed={view === "log"} onClick={() => setView("log")}>Journal</button><button aria-pressed={view === "portfolio"} onClick={() => setView("portfolio")}>Portfolio</button></div>}>
        <Stats><Stat value={projects.length} label="Projects" /><Stat value={`${hours} h`} label="Hands-on time" /><Stat value={problems} label="Problems solved" tone="good" /><Stat value={allSkills.length} label="Skills shown" /></Stats>
      </Section>
      {view === "log" && p && <>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <label className="field" style={{ flex: "0 1 320px" }}><span>Project</span><select id="tk-p" className="input" value={p.id} onChange={x => setOpenId(x.target.value)}>{projects.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
          <button className="btn small" onClick={() => { const n: Project = { id: uid(), title: "New project", goal: "", status: "idea", skills: [], entries: [], reflection: "" }; setProjects([...projects, n]); setOpenId(n.id); }}>New project</button>
        </div>
        <div className="grid2">
          <Section title="About this project">
            <div className="stack" style={{ gap: 10 }}>
              <label className="field"><span>Title</span><input id="tk-t" className="input" value={p.title} onChange={x => set({ title: x.target.value })} /></label>
              <label className="field"><span>What problem is it solving?</span><textarea id="tk-g" className="input" rows={2} value={p.goal} onChange={x => set({ goal: x.target.value })} /></label>
              <label className="field"><span>Status</span><select id="tk-s" className="input" value={p.status} onChange={x => set({ status: x.target.value as Project["status"] })}><option value="idea">Idea</option><option value="building">Building</option><option value="done">Finished</option></select></label>
              <div className="row" style={{ gap: 4 }}>{SKILLS.map(s => <button key={s} type="button" className="btn small" aria-pressed={p.skills.includes(s)} style={p.skills.includes(s) ? { background: "var(--ink)", color: "var(--bg)" } : undefined} onClick={() => set({ skills: p.skills.includes(s) ? p.skills.filter(x => x !== s) : [...p.skills, s] })}>{s}</button>)}</div>
              <label className="field"><span>What would you do differently? (for the portfolio)</span><textarea id="tk-r" className="input" rows={2} value={p.reflection} onChange={x => set({ reflection: x.target.value })} /></label>
            </div>
          </Section>
          <Section title="Today's session">
            <form className="stack" style={{ gap: 10 }} onSubmit={addEntry}>
              <label className="field"><span>What did you do?</span><textarea id="tk-d" className="input" rows={2} value={e.did} onChange={x => setE({ ...e, did: x.target.value })} /></label>
              <label className="field"><span>What went wrong?</span><input id="tk-pr" className="input" value={e.problem} onChange={x => setE({ ...e, problem: x.target.value })} /></label>
              <label className="field"><span>How did you fix it?</span><input id="tk-f" className="input" value={e.fix} onChange={x => setE({ ...e, fix: x.target.value })} /></label>
              <div className="row" style={{ alignItems: "flex-end" }}><label className="field" style={{ flex: "0 0 100px" }}><span>Hours</span><input id="tk-h" className="input num" value={e.hours} onChange={x => setE({ ...e, hours: x.target.value })} /></label><label className="btn small">{file ? "Photo added" : "Add a photo"}<input type="file" accept="image/*" hidden onChange={x => setFile(x.target.files?.[0] ?? null)} /></label><button className="btn primary" type="submit">Save entry</button></div>
            </form>
          </Section>
        </div>
        <Section title="Journal">
          <div className="stack" style={{ gap: 12 }}>{[...p.entries].reverse().map(x => (
            <div key={x.id} className="tk-entry">{x.photo && <Photo id={x.id} />}<div style={{ flex: 1 }}><p className="note">{prettyDate(x.date)} · {x.hours} h</p><p>{x.did}</p>{x.problem && <p className="note"><strong>Problem:</strong> {x.problem}</p>}{x.fix && <p className="note"><strong>Fix:</strong> {x.fix}</p>}</div><button className="btn ghost small danger" onClick={() => set({ entries: p.entries.filter(y => y.id !== x.id) })}>×</button></div>
          ))}{p.entries.length === 0 && <p className="empty-note">No sessions yet.</p>}</div>
        </Section>
      </>}
      {view === "portfolio" && <section className="panel tk-port">
        <div className="row no-print" style={{ justifyContent: "space-between" }}><div className="row"><input className="input" aria-label="Name" value={me.name} onChange={x => setMe({ ...me, name: x.target.value })} /><input className="input" aria-label="School" value={me.school} onChange={x => setMe({ ...me, school: x.target.value })} /><input className="input" aria-label="Year" value={me.year} onChange={x => setMe({ ...me, year: x.target.value })} /></div><button className="btn primary" onClick={() => window.print()}>Print or save as PDF</button></div>
        <h1 className="tk-name">{me.name}</h1><p className="note">{me.school} · {me.year} · {hours} hours of hands-on making across {projects.length} projects</p>
        <p style={{ marginTop: 8 }}>Skills: {allSkills.join(", ")}</p>
        {projects.map(x => (
          <article key={x.id} className="tk-proj">
            <h2>{x.title} <span className="pill">{x.status === "done" ? "Finished" : x.status === "building" ? "In progress" : "Idea"}</span></h2>
            <p><strong>Goal:</strong> {x.goal}</p>
            <p className="note">{x.entries.length} sessions · {x.entries.reduce((a, y) => a + y.hours, 0)} hours · {x.skills.join(", ")}</p>
            {x.entries.filter(y => y.problem).length > 0 && <><h3>Problems I solved</h3><ul>{x.entries.filter(y => y.problem).map(y => <li key={y.id}>{y.problem} <em>{y.fix}</em></li>)}</ul></>}
            <div className="tk-gal">{x.entries.filter(y => y.photo).map(y => <Photo key={y.id} id={y.id} />)}</div>
            {x.reflection && <p><strong>Next time:</strong> {x.reflection}</p>}
          </article>
        ))}
      </section>}
      <style>{`.tk-entry{display:flex;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--line)}.tk-photo{width:120px;height:90px;object-fit:cover;border-radius:6px}.tk-port{background:#fff;color:#151933}.tk-name{font-size:clamp(34px,5vw,54px)}
      .tk-proj{margin-top:24px;padding-top:18px;border-top:2px solid #151933;display:grid;gap:8px}.tk-proj h2{font-size:28px}.tk-proj h3{font-size:18px}.tk-proj em{color:#555C78}.tk-gal{display:flex;gap:8px;flex-wrap:wrap}
      @media print{body *{visibility:hidden}.tk-port,.tk-port *{visibility:visible}.tk-port{position:absolute;inset:0 auto auto 0;width:100%;box-shadow:none}.no-print{display:none!important}.tk-proj{break-inside:avoid}}`}</style>
    </div>
  );
}
