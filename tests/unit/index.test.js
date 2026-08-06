import { jest } from '@jest/globals';

const EJOBS_SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div class="job-card">
    <div class="job-card-content-middle">
      <h2 class="job-card-content-middle__title"><a href="/user/locuri-de-munca/agent-vanzari-birou-cluj/1972505" class=""><span>Agent vanzari birou - Cluj</span></a></h2>
      <h3 class="job-card-content-middle__info job-card-content-middle__info--darker"><a href="/company/mairon-galati-s-a/19073">MAIRON GALATI S.A.</a></h3>
      <div class="job-card-content-middle__info">Cluj-Napoca <!----><!----></div>
    </div>
  </div>
  <div class="job-card">
    <div class="job-card-content-middle">
      <h2 class="job-card-content-middle__title"><a href="/user/locuri-de-munca/agent-servicii-client-galati/1971999" class=""><span>Agent servicii client - Galati</span></a></h2>
      <h3 class="job-card-content-middle__info job-card-content-middle__info--darker"><a href="/company/mairon-galati-s-a/19073">MAIRON GALATI S.A.</a></h3>
      <div class="job-card-content-middle__info">Galați (Galați) <!----><!----></div>
    </div>
  </div>
</body>
</html>
`;

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    index = await import('../../scraper/index.js');
  });

  describe('transformJobsForSOLR', () => {
    it('should filter locations to only Romanian cities', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: ['România'] },
          { url: 'https://test.com/2', title: 'Job 2', location: ['Bucharest'] },
          { url: 'https://test.com/3', title: 'Job 3', location: ['Bulgaria'] },
          { url: 'https://test.com/4', title: 'Job 4', location: ['Cluj-Napoca'] },
          { url: 'https://test.com/5', title: 'Job 5', location: [] }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].location).toEqual(['România']);
      expect(result.jobs[1].location).toEqual(['Bucharest']);
      expect(result.jobs[2].location).toEqual(['România']);
      expect(result.jobs[3].location).toEqual(['Cluj-Napoca']);
      expect(result.jobs[4].location).toEqual(['România']);
    });

    it('should keep company uppercase', () => {
      const payload = {
        source: 'ejobs.ro',
        company: 'mairon galati sa',
        cif: '6581999',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'mairon galati sa', cif: '6581999' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('MAIRON GALATI SA');
    });

    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' },
          { url: 'https://test.com/4', title: 'Job 4', workmode: 'hybrid' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
      expect(result.jobs[3].workmode).toBe('hybrid');
    });

    it('should handle empty jobs array', () => {
      const result = index.transformJobsForSOLR({ jobs: [] });
      expect(result.jobs).toEqual([]);
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://www.ejobs.ro/user/locuri-de-munca/agent-vanzari-birou-cluj/1972505',
        title: 'Agent vanzari birou - Cluj',
        location: ['Cluj-Napoca'],
        tags: ['vanzari'],
        workmode: 'on-site'
      };

      const COMPANY_NAME = 'MAIRON GALATI SA';
      const COMPANY_CIF = '6581999';

      const result = index.mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(COMPANY_CIF);
      expect(result.location).toEqual(rawJob.location);
      expect(result.tags).toEqual(rawJob.tags);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
      expect(result.date).toBeDefined();
    });

    it('should remove undefined fields', () => {
      const rawJob = {
        url: 'https://test.com/1',
        title: 'Job 1'
      };

      const result = index.mapToJobModel(rawJob, '6581999');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });

    it('should handle missing title', () => {
      const rawJob = { url: 'https://test.com/1' };

      const result = index.mapToJobModel(rawJob, '6581999');

      expect(result.title).toBeUndefined();
      expect(result.url).toBe('https://test.com/1');
    });
  });

  describe('parseEJobsJobs', () => {
    it('should parse eJobs company page job cards', () => {
      const result = index.parseEJobsJobs(EJOBS_SAMPLE_HTML);

      expect(result).toHaveLength(2);

      expect(result[0].url).toBe('https://www.ejobs.ro/user/locuri-de-munca/agent-vanzari-birou-cluj/1972505');
      expect(result[0].title).toBe('Agent vanzari birou - Cluj');
      expect(result[0].location).toEqual(['Cluj-Napoca']);

      expect(result[1].url).toBe('https://www.ejobs.ro/user/locuri-de-munca/agent-servicii-client-galati/1971999');
      expect(result[1].title).toBe('Agent servicii client - Galati');
      expect(result[1].location).toEqual(['Galați']);
    });

    it('should strip county parenthetical from location', () => {
      const result = index.parseEJobsJobs(EJOBS_SAMPLE_HTML);
      expect(result[1].location).toEqual(['Galați']);
      expect(result[1].location[0]).not.toContain('(');
    });

    it('should handle absolute URLs', () => {
      const html = `<h2 class="job-card-content-middle__title"><a href="https://www.ejobs.ro/user/locuri-de-munca/test/1" class=""><span>Test Job</span></a></h2><div class="job-card-content-middle__info">Iași <!----></div>`;
      const result = index.parseEJobsJobs(html);

      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://www.ejobs.ro/user/locuri-de-munca/test/1');
    });

    it('should deduplicate repeated job cards', () => {
      const html = EJOBS_SAMPLE_HTML + EJOBS_SAMPLE_HTML;
      const result = index.parseEJobsJobs(html);

      expect(result).toHaveLength(2);
    });

    it('should handle missing location', () => {
      const html = `<h2 class="job-card-content-middle__title"><a href="/job/no-loc" class=""><span>No Location</span></a></h2>`;
      const result = index.parseEJobsJobs(html);

      expect(result).toHaveLength(1);
      expect(result[0].location).toBeUndefined();
    });

    it('should handle empty HTML', () => {
      const result = index.parseEJobsJobs('');
      expect(result).toEqual([]);
    });
  });
});
