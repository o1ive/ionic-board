import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import * as moment from 'moment';

import {
  AngularFirestore,
  AngularFirestoreCollection
} from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase';

// 定義したインターフェースをインポートしておく
import { Post } from '../models/post';
import { async } from '@angular/core/testing';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  message: string;
  post: Post;
  posts: Post[];

  // Firestoreのコレクションを扱うプロパティ
  postsCollection: AngularFirestoreCollection<Post>;

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private afStore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit() {
    this.afStore.firestore.enableNetwork();
    // コンポーネントの初期化時に、投稿を読み込むgetPosts()を実行
    this.getPosts();
  }

  addPost() {
    // 入力されたメッセージを使って、投稿データを作成
    this.post = {
      id: '',
      userName: this.afAuth.auth.currentUser.displayName,
      message: this.message,
      created: firebase.firestore.FieldValue.serverTimestamp()
    };

    this.afStore
      .collection('posts')
      .add(this.post)
      // 成功
      .then(docRef => {
        // 一度投稿を追加した後に、idを更新している
        this.postsCollection.doc(docRef.id).update({
          id: docRef.id
        });
        // 追加できたら入力フィールドを空にする
        this.message = '';
      })
      .catch(async error => {
        // エラーをToastControllerで表示
        const toast = await this.toastCtrl.create({
          message: error.toString(),
          duration: 3000
        });
        await toast.present();
      });
  }

  // Firestoreから投稿データを読み込む
  getPosts() {
    // コレクションの参照を取得している
    this.postsCollection = this.afStore.collection(
      'posts', ref => ref.orderBy('created', 'desc')
    );

    // データに変更があったらそれを受け取ってpostsに入れる
    this.postsCollection.valueChanges().subscribe(data => {
      this.posts = data;
    });
  }

  async presentPrompt(post: Post) {
    const alert = await this.alertCtrl.create({
      header: 'メッセージ編集',
      inputs: [
        {
          name: 'message',
          type: 'text',
          placeholder: 'メッセージ'
        }
      ],
      buttons: [
        {
          text: 'キャンセル',
          role: 'cancel',
          handler: () => {
            console.log('キャンセルが選択されました');
          }
        },
        {
          text: '更新',
          handler: data => {
            // 投稿を更新するメソッドを実行
            this.updatePost(post, data.message);
          }
        }
      ]
    });
    await alert.present();
  }

  // メッセージを更新する
  // 更新される投稿とメッセージを受け取る
  updatePost(post: Post, message: string) {
    // 入力されたメッセージで投稿を更新
    this.postsCollection
      .doc(post.id)
      .update({
        message: message
      })
      .then(async () => {
        const toast = await this.toastCtrl.create({
          message: '投稿が更新されました',
          duration: 3000
        });
        await toast.present();
      })
      .catch(async error => {
        const toast = await this.toastCtrl.create({
          message: error.toString(),
          duration: 3000
        });
        await toast.present();
      });
  }

  // 投稿を削除する
  deletePost(post: Post) {
    // 受け取った投稿のidを参照して削除
    this.postsCollection
      .doc(post.id)
      .delete()
      .then(async () => {
        const toast = await this.toastCtrl.create({
          message: '投稿が削除されました',
          duration: 3000
        });
        await toast.present();
      })
      .catch(async error => {
        const toast = await this.toastCtrl.create({
          message: error.toString(),
          duration: 3000
        });
        await toast.present();
      });
  }

  // 投稿日時と現在日時殿さを返す
  differenceTime(time: Date): string {
    moment.locale('ja');
    return moment(time).fromNow();
  }

  // ログアウト処理
  logout() {
    this.afStore.firestore.disableNetwork();
    this.afAuth.auth
      .signOut()
      .then(async () => {
        const toast = await this.toastCtrl.create({
          message: 'ログアウト',
          duration: 3000
        });
        await toast.present();
        this.router.navigateByUrl('/login');
      })
      .catch(async error => {
        const toast = await this.toastCtrl.create({
          message: error.toString(),
          duration: 3000
        });
        await toast.present();
      });
  }
}
