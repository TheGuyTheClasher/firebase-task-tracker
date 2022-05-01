import { Component } from '@angular/core';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { Task } from './task/task';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TaskDialogResult } from './task-dialog/task-dialog.component';

import { Observable } from 'rxjs';

import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

const getObservable = (collection: AngularFirestoreCollection<Task>) => {
  const subject = new BehaviorSubject<Task[]>([]);
  collection.valueChanges({ idField: 'id' }).subscribe((val: Task[]) => {
    subject.next(val);
  });
  return subject;
};
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Task-tracker';
  horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  snackBarDurationInSeconds = 3;

  todo = getObservable(this.store.collection('todo')) as Observable<Task[]>;
  inProgress = getObservable(this.store.collection('inProgress')) as Observable<
    Task[]
  >;
  done = getObservable(this.store.collection('done')) as Observable<Task[]>;

  constructor(
    private dialog: MatDialog,
    private store: AngularFirestore,
    private _snackBar: MatSnackBar
  ) {}

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '300px',
      height: '350px',
      data: {
        task: {},
      },
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (typeof result === 'object') {
          if (
            result.task.title === undefined ||
            result.task.description === undefined ||
            result.task.title === '' ||
            result.task.description === ''
          ) {
            return;
          }
          this.store.collection('todo').add(result.task);
          this.openSnackBar('Task added!!', 'Close');
        }
      });
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '300px',
      height: '350px',
      data: {
        task,
        enableDelete: true,
      },
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (typeof result === 'object') {
          if (result.task.title === '' || result.task.description === '') {
            return;
          }
          if (result.delete) {
            this.store.collection(list).doc(task.id).delete();
            this.openSnackBar('Task deleted!!', 'Close');
          } else {
            this.store.collection(list).doc(task.id).update(task);
            this.openSnackBar('Task updated!!', 'Close');
          }
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

  openSnackBar(msg, close) {
    this._snackBar.open(msg, close, {
      duration: this.snackBarDurationInSeconds * 1000,
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
    });
  }
}
