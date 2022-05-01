import { Component } from '@angular/core';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { Task } from './task/task';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TaskDialogResult } from './task-dialog/task-dialog.component';

import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Task-tracker';
  // todo: Task[] = [
  //   {
  //     title: 'Buy milk',
  //     description: 'Go to the store and buy milk',
  //   },
  //   {
  //     title: 'Create a Kanban app',
  //     description: 'Using Firebase and Angular create a Kanban app!',
  //   },
  // ];
  // inProgress: Task[] = [];
  // done: Task[] = [];

  todo = this.store
    .collection('todo')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  inProgress = this.store
    .collection('inProgress')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  done = this.store
    .collection('done')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;

  constructor(private dialog: MatDialog, private store: AngularFirestore) {}

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        // this.todo.push(result.task);
        this.store.collection('todo').add(result.task);
      });
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        // const dataList = this[list];
        // const taskIndex = dataList.indexOf(task);
        if (result.delete) {
          this.store.collection(list).doc(task.id).delete();
        } else {
          this.store.collection(list).doc(task.id).update(task);
        }
      });
  }

  drop(event: CdkDragDrop<Task[] | null>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    this.store.firestore.runTransaction(() => {
      const promise = Promise.all([
        this.store.collection(event.previousContainer.id).doc(item.id).delete(),
        this.store.collection(event.container.id).add(item),
      ]);
      return promise;
    });
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }
}
