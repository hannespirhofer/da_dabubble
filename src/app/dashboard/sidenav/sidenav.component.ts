import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { DataService } from '../../services/data.service';
import { User } from '../../models/user.class';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Channel } from '../../models/channel.class';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddChannelComponent } from '../../dialog/add-channel/add-channel.component';


@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    MatSidenavModule,
    CommonModule,
    MatButtonModule,
    MatDrawer,
    MatDrawerContainer,
    MatDrawerContent,
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0,
        transform: 'translateX(-100%)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateX(0)'
      })),
      transition(':enter', [animate('300ms ease-in')]),
      transition(':leave', [animate('300ms ease-out')])
    ])
  ]
})


export class SidenavComponent {

  opened: boolean = true;
  showChannels: boolean = true;
  showDirectMessages: boolean = true;
  online: boolean = true;
  users: any;
  channels: any;
  userId: string = '';
  selectedUser: User[] = [];
  allChannels: Partial<Channel>[] = [];
  channelTitles: { channelId: string, title: string }[] = [];
  directMessageTitle: { imageUrl: string, onlineStatus: string, name: string, id: string, chatId: string }[] = [];


  private userSub = new Subscription();
  private channelSub = new Subscription();


  constructor(private dataService: DataService, private authService: AuthService, public dialog: MatDialog) {
    this.dataSubscriptions();
  }


  /**
   * Subscribe users and channels from DataService
   */
  dataSubscriptions() {
    this.userSub = this.dataService.getUsersList().subscribe(users => {
      this.users = users;
      this.updateDirectMessages();
      this.refreshChannels();
      this.authService.getUserAuthId().then(uid => {
        if (uid) {
          this.setUserData(uid);
        } else {
          console.log('Keine UID verfügbar');
        }
      }).catch(error => {
        console.error('Fehler beim Laden der UID:', error);
      });
    });
    this.channelSub = this.dataService.getChannelsList().subscribe(channels => {
      this.channels = channels;
      this.refreshChannels();
      this.checkDataForChannelNames();
    });
  }


  /**
   * Main function to update user onlineStatus
   */
  updateDirectMessages() {
    if (this.selectedUser && this.selectedUser.length > 0) {
      this.getUserDirectMessages();
    }
  }


  /**
   * Checking the validity of the data of users and channels from the Observable 
   */
  checkDataForChannelNames() {
    if (this.users && this.channels) {
      this.updateChannelTitles();
      this.getUserDirectMessages();
    }
  }


  /**
   * Read out the user data based on the user authentication id.
   * 
   * @param uid - User authentication id from firestore authentication
   * @returns - Return if error exists
   */
  setUserData(uid: string) {
    if (!this.users) {
      console.error('Benutzerdaten sind noch nicht geladen.');
      return;
    }
    const user = this.users.find((user: User) => user.authUserId === uid);
    if (user) {
      this.selectedUser = [];
      this.selectedUser.push(user);
    } else {
      console.log('Kein User gefunden', uid);
    }
  }


  /**
   * Pull refresh for channels on change.
   */
  refreshChannels() {
    this.dataService.getChannelsList().subscribe(channels => {
      this.channels = channels;
      this.updateChannelTitles();
      this.checkDataForChannelNames();
    });
  }


  /**
   * Set and Update the channel titles for the sidenav rendering.
   */
  updateChannelTitles() {
    this.channelTitles = [];
    this.selectedUser.forEach(user => {
      if (user.channels && Array.isArray(user.channels)) {
        user.channels.forEach(userChannelId => {
          const matchedChannel = this.channels.find((channel: Channel) => channel.channelId === userChannelId);
          if (matchedChannel) { // && matchedChannel.channelId && matchedChannel.title) {
            this.channelTitles.push({
              channelId: matchedChannel.channelId,
              title: matchedChannel.title
            });
          }
        });
      }
    });
  }


  /**
   * Get and set direct messages to display in the sidenav.
   */
  // getUserDirectMessages(): void {
  //   this.directMessageTitle = [];
  //   if (this.selectedUser && this.selectedUser.length > 0) {
  //     this.selectedUser.forEach((selected: User) => {
  //       if (selected.userChats && Array.isArray(selected.userChats)) {
  //         selected.userChats.forEach(chat => {
  //           const chatId = chat.userChatId;
  //           const matchedUser = this.users.find((user: User) => user.id === chatId);
  //           if (matchedUser) {
  //             let displayName = matchedUser.name;
  //             if (matchedUser.id === this.selectedUser[0].id) {
  //               displayName += " (Du)";
  //             }
  //             if (!this.directMessageTitle.some(dm => dm.id === matchedUser.id)) {
  //               this.directMessageTitle.push({
  //                 id: matchedUser.id,
  //                 imageUrl: matchedUser.imageUrl,
  //                 name: displayName,
  //                 onlineStatus: matchedUser.onlineStatus,
  //                 chatId: chat.chatId
  //               });
  //             }
  //           }
  //         });
  //       }
  //     });
  //   } else {
  //     console.log('Keine ausgewählten Benutzer vorhanden.');
  //   }
  //   this.sortDirectMessageUsers();
  // }

  /**
   * Main method that is called to display all direct message chats in the sidebar.
   * 
   * @returns - null if no user is found
   */
  getUserDirectMessages(): void {
    this.directMessageTitle = [];
    if (!this.selectedUser || this.selectedUser.length === 0) {
      console.log('Keine ausgewählten Benutzer vorhanden.');
      return;
    }
    this.selectedUser.forEach(user => this.processUser(user));
    this.sortDirectMessageUsers();
  }



  // Definiert eine Methode zur Verarbeitung einzelner Benutzer
  private processUser(selected: User): void {
    if (!selected.userChats || !Array.isArray(selected.userChats)) return;
    selected.userChats.forEach(chat => {
      const matchedUser = this.findUserById(chat.userChatId);
      if (!matchedUser) return;
      const displayName = this.buildDisplayName(matchedUser);
      if (this.isUniqueDirectMessage(matchedUser.id)) {
        this.addDirectMessage(matchedUser, displayName, chat.chatId);
      }
    });
  }

  // Hilfsmethode, um einen Benutzer anhand der ID zu finden
  private findUserById(userId: string): User | undefined {
    return this.users.find((user: User) => user.id === userId);
  }

  // Erstellt den Anzeigenamen für die Direktnachricht
  private buildDisplayName(user: User): string {
    let displayName = user.name;
    if (user.id === this.selectedUser[0].id) {
      displayName += " (Du)";
    }
    return displayName;
  }

  // Überprüft, ob die Direktnachricht einzigartig ist
  private isUniqueDirectMessage(userId: string): boolean {
    return !this.directMessageTitle.some(dm => dm.id === userId);
  }

  // Fügt eine neue Direktnachricht hinzu
  private addDirectMessage(user: User, displayName: string, chatId: string): void {
    this.directMessageTitle.push({
      id: user.id,
      imageUrl: user.imageUrl,
      name: displayName,
      onlineStatus: user.onlineStatus,
      chatId: chatId
    });
  }


  /**
   * Fetching and sorting the user list for the sidenav. 
   * Main reason to display yourself at the top.
   */
  sortDirectMessageUsers() {
    this.directMessageTitle.sort((a, b) => {
      if (a.id === this.selectedUser[0].id) return -1;
      if (b.id === this.selectedUser[0].id) return 1;
      return 0;
    });
  }


  /**
   * Toggle variable for sidenav to open or close.
   */
  toggleSidenav(value: string) {
    if (value === 'sidenav') {
      this.opened = !this.opened;
    }
    if (value === 'channels') {
      this.showChannels = !this.showChannels;
    }
    if (value === 'private') {
      this.showDirectMessages = !this.showDirectMessages;
    }
  }


  /**
   * Open AddChannelComponent per material dialog.
   */
  openDialog() {
    this.dialog.open(AddChannelComponent);
  }


  /**
   * Called when an instance of the component or service is destroyed. 
   * This method takes care of cleaning up resources, in particular canceling subscriptions to avoid memory leaks.
   */
  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.channelSub) {
      this.channelSub.unsubscribe();
    }
  }
}