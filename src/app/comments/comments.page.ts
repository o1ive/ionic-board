import { Component, OnInit } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreCollection
} from '@angular/fire/firestore';
import * as firebase from 'firebase';
import { Comment } from '../models/comment';
import { Post } from '../models/post';
import { async } from 'q';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.page.html',
  styleUrls: ['./comments.page.scss'],
})
export class CommentsPage implements OnInit {
  sourcePost: Post;
  message: string;
  comment: Comment;
  comments: Comment[];
  commentsCollection: AngularFirestoreCollection<Comment>;

  constructor(
    private toastCtrl: ToastController,
    private afAuth: AngularFireAuth,
    private afStore: AngularFirestore,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.getComments();
  }

  getComments() {
    // 条件を指定して、投稿日時でソート
    this.commentsCollection = this.afStore
      .collection('comments', ref =>
      ref.where('sourcePostId', '==', this.sourcePost.id)
      .orderBy('created', 'desc')
    );
    // コメントに変更があったときにコメントの情報を更新
    this.commentsCollection.valueChanges().subscribe(data => {
      this.comments = data;
    });

  }

  addComment() {
    this.comment = {
      userName: this.afAuth.auth.currentUser.displayName,
      message: this.message,
      created: firebase.firestore.FieldValue.serverTimestamp(),
      sourcePostId: this.sourcePost.id
    };

    this.afStore
      .collection('comments')
      .add(this.comment)
      .then(async () => {
        const toast = await this.toastCtrl.create({
          message: 'コメントを投稿しました',
          duration: 3000
        });
        await toast.present();
        this.message = '';
      })
      .catch(async error => {
        const toast = await this.toastCtrl.create({
          message: error.toString(),
          duration: 3000
        });
        await toast.present();
      });
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }

}
