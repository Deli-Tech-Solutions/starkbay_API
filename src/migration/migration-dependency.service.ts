import { Injectable, Logger } from '@nestjs/common';

export interface MigrationDependency {
  name: string;
  dependencies: string[];
  dependents: string[];
}

@Injectable()
export class MigrationDependencyService {
  private readonly logger = new Logger(MigrationDependencyService.name);
  private dependencyGraph: Map<string, MigrationDependency> = new Map();

  addMigration(name: string, dependencies: string[] = []): void {
    if (!this.dependencyGraph.has(name)) {
      this.dependencyGraph.set(name, {
        name,
        dependencies: [],
        dependents: [],
      });
    }

    const migration = this.dependencyGraph.get(name)!;
    migration.dependencies = [...new Set([...migration.dependencies, ...dependencies])];

    // Update dependents
    dependencies.forEach(dep => {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, {
          name: dep,
          dependencies: [],
          dependents: [],
        });
      }
      
      const dependency = this.dependencyGraph.get(dep)!;
      if (!dependency.dependents.includes(name)) {
        dependency.dependents.push(name);
      }
    });
  }

  validateDependencies(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const [name] of this.dependencyGraph) {
      if (!visited.has(name)) {
        if (this.hasCyclicDependency(name, visited, recursionStack)) {
          errors.push(`Circular dependency detected involving migration: ${name}`);
        }
      }
    }

    // Check for missing dependencies
    for (const [name, migration] of this.dependencyGraph) {
      for (const dep of migration.dependencies) {
        if (!this.dependencyGraph.has(dep)) {
          errors.push(`Migration ${name} depends on missing migration: ${dep}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getExecutionOrder(): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (name: string) => {
      if (temp.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      
      if (!visited.has(name)) {
        temp.add(name);
        
        const migration = this.dependencyGraph.get(name);
        if (migration) {
          migration.dependencies.forEach(dep => visit(dep));
        }
        
        temp.delete(name);
        visited.add(name);
        result.push(name);
      }
    };

    for (const [name] of this.dependencyGraph) {
      if (!visited.has(name)) {
        visit(name);
      }
    }

    return result;
  }

  private hasCyclicDependency(
    name: string,
    visited: Set<string>,
    recursionStack: Set<string>,
  ): boolean {
    visited.add(name);
    recursionStack.add(name);

    const migration = this.dependencyGraph.get(name);
    if (migration) {
      for (const dep of migration.dependencies) {
        if (!visited.has(dep)) {
          if (this.hasCyclicDependency(dep, visited, recursionStack)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }
    }

    recursionStack.delete(name);
    return false;
  }

  getDependencyInfo(name: string): MigrationDependency | null {
    return this.dependencyGraph.get(name) || null;
  }

  getAllDependencies(): MigrationDependency[] {
    return Array.from(this.dependencyGraph.values());
  }
}