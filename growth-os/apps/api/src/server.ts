import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { initDb, pool } from './db.js';
import { runAudit } from './audit.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'growth-os-api', time: new Date().toISOString() }));

app.get('/projects', async (_req, res) => {
  const { rows } = await pool.query('select * from projects order by created_at desc');
  res.json(rows);
});

app.get('/projects/:id/audits', async (req, res) => {
  const { rows } = await pool.query('select id, domain, overall_score, seo_score, geo_score, aeo_score, aio_score, ads_readiness_score, created_at from audits where project_id=$1 order by created_at desc', [req.params.id]);
  res.json(rows);
});

app.post('/audit', async (req, res) => {
  const parsed = z.object({ domain: z.string().min(3), projectName: z.string().min(1).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Geçerli bir domain girin.' });

  try {
    const result = await runAudit(parsed.data.domain);
    const hostname = new URL(result.domain).hostname.replace(/^www\./, '');
    const projectName = parsed.data.projectName || hostname;

    const projectResult = await pool.query(
      `insert into projects(name, domain) values($1,$2)
       on conflict(domain) do update set name=excluded.name
       returning id, name, domain`,
      [projectName, hostname]
    );
    const project = projectResult.rows[0];

    const insert = await pool.query(
      `insert into audits(project_id, domain, overall_score, seo_score, geo_score, aeo_score, aio_score, ads_readiness_score, payload)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning id, created_at`,
      [project.id, result.domain, result.overallScore, result.scores.seo, result.scores.geo, result.scores.aeo, result.scores.aio, result.scores.adsReadiness, result]
    );

    return res.json({ project, audit: { ...result, id: insert.rows[0].id, createdAt: insert.rows[0].created_at } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit başarısız';
    return res.status(502).json({ error: message });
  }
});

app.get('/audits/:id', async (req, res) => {
  const { rows } = await pool.query('select payload, created_at from audits where id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Audit bulunamadı' });
  res.json({ ...rows[0].payload, createdAt: rows[0].created_at });
});

const port = Number(process.env.PORT || 4000);
initDb().then(() => app.listen(port, '0.0.0.0', () => console.log(`Growth OS API :${port}`))).catch((error) => {
  console.error(error);
  process.exit(1);
});
