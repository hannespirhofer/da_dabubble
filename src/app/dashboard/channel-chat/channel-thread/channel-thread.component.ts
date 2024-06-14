import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Thread } from '../../../models/thread.class';
import { CommonModule } from '@angular/common';
import { EmojiMartComponent } from '../../emoji-mart/emoji-mart.component';
import { ChannelChatComponent } from '../channel-chat.component';
import { MessageReactionComponent } from '../message-reaction/message-reaction.component';
import { DashboardComponent } from '../../dashboard.component';
import { DataService } from '../../../services/data.service';
import { ThreadService } from '../../../services/thread.service';
import { MatMenuModule } from '@angular/material/menu';
import { User } from '../../../models/user.class';
import { deleteObject, getStorage, ref } from '@angular/fire/storage';
import { ViewProfileComponent } from '../../../dialog/view-profile/view-profile.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-channel-thread',
  standalone: true,
  imports: [
    CommonModule,
    MessageReactionComponent,
    EmojiMartComponent,
    MatMenuModule,
  ],
  templateUrl: './channel-thread.component.html',
  styleUrl: './channel-thread.component.scss',
})

export class ChannelThreadComponent {

  @Input() thread!: Thread;

  @ViewChild(MessageReactionComponent) messageReaction!: MessageReactionComponent;
  @ViewChild("editMessageBox") editMessageBox!: ElementRef;
  threadUser!: User
  isCurrentUser: boolean = false;
  // setReactionMenuHover: boolean = false;
  editMessage: boolean = false;
  imgFile: string = '';
  isImgFileEdited: boolean = false;

  constructor(
    public channelChat: ChannelChatComponent,
    public dashboard: DashboardComponent,
    public dataService: DataService,
    public threadService: ThreadService,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    let currentUserId = this.channelChat.currentUser.id;
    let messageOwnerId = this.thread.messages[0].senderId
    if (currentUserId == messageOwnerId) {
      this.isCurrentUser = true;
    } else {
      this.isCurrentUser = false;
    }
    this.findThreadUser(messageOwnerId);
  }

  findThreadUser(messageOwnerId: string) {
    this.dataService.allUsers.forEach(user => {
      if (user.id == messageOwnerId) {
        this.threadUser = user;
      }
    })
  }

  formattedDatestamp(): any {
    return this.thread.getFormattedDatestamp();
  }

  formattedTimeStamp(): any {
    return this.thread.getFormattedTimeStamp();
  }

  async openThread(thread: Thread) {
    try {
      await this.threadService.openFullThread(true);
      setTimeout(() => {
        this.threadService.changeThread(thread, this.threadUser, this.channelChat.currentChannel, this.channelChat.currentUser);
      }, 0);
    } catch (error) {
      console.error('Error opening thread:', error);
    }
  }

  editThreadMessage() {
    // this.setReactionMenuHover = false;
    this.editMessage = true;
  }

  cancelEditMessage() {
    this.editMessage = false;
    this.isImgFileEdited = false;
  }

  showProfile(participant: any) {
    this.dialog.open(ViewProfileComponent, {
      data: participant
   });
 }

  async saveEditMessage(messageElement: Thread) {
    messageElement.messages[0].content = this.editMessageBox.nativeElement.value
    if(this.isImgFileEdited) {
    const storage = getStorage();
    const desertRef = ref(storage, this.imgFile);
    deleteObject(desertRef).then(() => {
      messageElement.messages[0].imgFileURL = '';
    }).catch((error) => {
      // Uh-oh, an error occurred!
    });
    }
    this.threadService.copyThreadForFirebase(messageElement)
    this.editMessage = false;
  }

  deleteImg(obj: any) {
    this.imgFile = obj.messages[0].imgFileURL;
    this.isImgFileEdited = true;
    obj.messages[0].imgFileURL = '';
  }
}

