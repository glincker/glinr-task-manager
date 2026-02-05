import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initStorage } from '../storage/index.js';
import { 
  createProject, 
  getProject, 
  getProjectByKey, 
  updateProject, 
  queryProjects, 
  archiveProject,
  createProjectExternalLink,
  getProjectExternalLinks,
  findProjectByExternalId,
  createSprint, 
  getProjectSprints,
  startSprint,
  completeSprint,
  cancelSprint,
  getSprintWithStats
} from './index.js';
import { randomUUID } from 'crypto';

describe('Projects Service', () => {
  beforeAll(async () => {
    process.env.STORAGE_TIER = 'memory';
    await initStorage();
  });

  describe('Projects', () => {
    it('should create and retrieve a project', async () => {
      const key = `TST${Math.floor(Math.random() * 1000)}`;
      const input = {
        key,
        name: 'Test Project',
        description: 'A test project'
      };

      const project = await createProject(input);
      expect(project.id).toBeDefined();
      expect(project.key).toBe(key);

      const retrieved = await getProject(project.id);
      expect(retrieved?.name).toBe(input.name);

      const byKey = await getProjectByKey(key);
      expect(byKey?.id).toBe(project.id);
    });

    it('should update a project', async () => {
      const project = await createProject({
        key: `UPD${Math.floor(Math.random() * 1000)}`,
        name: 'Old Name'
      });

      const updated = await updateProject(project.id, { name: 'New Name' });
      expect(updated.name).toBe('New Name');
    });

    it('should query projects', async () => {
      await createProject({ key: 'Q1', name: 'Query Test 1' });
      await createProject({ key: 'Q2', name: 'Query Test 2' });

      const { projects, total } = await queryProjects({ search: 'Query Test' });
      expect(projects.length).toBeGreaterThanOrEqual(2);
      expect(total).toBeGreaterThanOrEqual(2);
    });

    it('should archive a project', async () => {
      const project = await createProject({ key: 'ARC', name: 'To Archive' });
      await archiveProject(project.id);
      const archived = await getProject(project.id);
      expect(archived?.status).toBe('archived');
      expect(archived?.archivedAt).toBeDefined();
    });

    it('should handled external links', async () => {
      const project = await createProject({ key: 'EXT', name: 'External Project' });
      await createProjectExternalLink(project.id, {
        platform: 'linear',
        externalId: 'team-123',
        externalUrl: 'https://linear.app/team-123'
      });

      const links = await getProjectExternalLinks(project.id);
      expect(links.length).toBe(1);
      expect(links[0].platform).toBe('linear');

      const found = await findProjectByExternalId('linear', 'team-123');
      expect(found?.id).toBe(project.id);
    });
  });

  describe('Sprints', () => {
    it('should manage sprint lifecycle', async () => {
      const project = await createProject({ key: 'LC', name: 'Lifecycle Project' });
      const sprint = await createSprint(project.id, { name: 'Lifecycle Sprint' });
      
      expect(sprint.status).toBe('planning');

      const started = await startSprint(sprint.id);
      expect(started.status).toBe('active');
      expect(started.startDate).toBeDefined();

      const completed = await completeSprint(sprint.id);
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();

      const cancelledSprint = await createSprint(project.id, { name: 'Cancel Me' });
      const cancelled = await cancelSprint(cancelledSprint.id);
      expect(cancelled.status).toBe('cancelled');
    });

    it('should get sprint with stats', async () => {
      const project = await createProject({ key: 'STS', name: 'Stats Project' });
      const sprint = await createSprint(project.id, { name: 'Stats Sprint' });
      
      const stats = await getSprintWithStats(sprint.id);
      expect(stats).not.toBeNull();
      expect(stats?.ticketCount).toBe(0);
    });
  });
});
