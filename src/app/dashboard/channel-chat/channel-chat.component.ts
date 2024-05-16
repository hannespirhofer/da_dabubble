import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatList, MatListModule } from '@angular/material/list';
import { Channel } from '../../models/channel.class';
import { StorageService } from '../../services/storage.service';
import { DataService } from '../../services/data.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ChannelThreadComponent } from './channel-thread/channel-thread.component';
import { User } from '../../models/user.class';
import { Thread } from '../../models/thread.class';
import { Observable, Subscription, map, startWith } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Message } from '../../models/message.class';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenuModule } from '@angular/material/menu';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MatInputModule } from '@angular/material/input';
// import 'emoji-picker-element';
@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatList,
    MatListModule,
    CommonModule,
    ChannelThreadComponent,
    ReactiveFormsModule,
    MatDialogModule,
    MatMenuTrigger,
    MatMenuModule,
    PickerComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    AsyncPipe,
  ],
  templateUrl: './channel-chat.component.html',
  styleUrl: './channel-chat.component.scss'
})
export class ChannelChatComponent {

  @ViewChild('threadMessageBox') threadMessageBox!: ElementRef;
  @ViewChild('imgBox') imgBox!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  constructor(public dataService: DataService,
    private route: ActivatedRoute,
    private router: Router,
    public storage: StorageService,
    private auth: AuthService,
    private formBuilder: FormBuilder) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });


  }


  userAuthId!: string;
  users: any;
  currentUser!: User;
  channels: any;
  channelId: string = '';
  currentChannel!: Channel;
  channelParticipants: any = [];
  channelParticipantsCounter: number = 0;
  threads: any;
  channelThreads!: Thread[];
  imgFile: File | undefined = undefined;


  private userSub: Subscription = new Subscription();
  private channelSub: Subscription = new Subscription();
  private threadsSub: Subscription = new Subscription();




  //-------------------//

  pingUserControl = new FormControl('');
  filteredUsers!: Observable<any[]>;



  //------------------//


  async ngOnInit() {
    this.resetParticipantsData();
    this.dataSubscriptions();
    await this.checkUserAuthId();



    setTimeout(() => {
      this.getChannelInfos();

      this.filteredUsers = this.pingUserControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filterUsers(value || ''))
      );
    }, 600);

  }


  private _filterUsers(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.users.filter((user: any) => user.name.toLowerCase().startsWith(filterValue));
  }

  resetParticipantsData() {
    this.channelParticipants = [];
    this.channelParticipantsCounter = 0;
  }


  dataSubscriptions() {
    this.userSub = this.dataService.getUsersList().subscribe((users: any) => {
      this.users = users;
    });
    this.channelSub = this.dataService.getChannelsList().subscribe(channels => {
      this.channels = channels;
    });
    this.threadsSub = this.dataService.getThreadsList().subscribe(threads => {
      this.threads = threads;
    });
  }


  async checkUserAuthId() {
    await this.auth.getUserAuthId().then(userId => {
      if (userId) {
        this.userAuthId = userId;
      } else {
        console.log("Kein Benutzer angemeldet.");
      }
    }).catch(error => {
      console.error("Fehler beim Abrufen der Benutzer-ID:", error);
    });

    setTimeout(() => {
      this.findCurrentUser(this.userAuthId);
    }, 500);
  }


  async findCurrentUser(authId: string) {
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].authUserId === authId) {
        this.currentUser = new User(this.users[i]);
        break;
      }
    }
  }


  getChannelInfos() {
    this.getCurrentChannel();
    this.showChannelParticipants(this.channelId);
    this.getChannelThreads(this.channelId);
  }


  async getCurrentChannel() {
    this.getChannelIdFromURL();

    for (let i = 0; i < this.channels.length; i++) {
      if (this.channels[i].channelId === this.channelId) {
        this.currentChannel = new Channel(this.channels[i]);
        break;
      }
    }
  }



  getChannelIdFromURL() {
    this.route.params.subscribe(params => {
      this.channelId = params['id'];
    });
  }


  async showChannelParticipants(channelId: string) {
    await this.users.forEach((user: any) => {
      if (user.channels && user.channels.includes(channelId)) {
        this.channelParticipants.push({
          participantImage: user.imageUrl
        }
        );
        this.channelParticipantsCounter++;
      }
    });
  }


  async getChannelThreads(channelId: string) {
    this.channelThreads = [];

    for (let i = 0; i < this.threads.length; i++) {
      if (this.threads[i].channelId === channelId) {
        this.channelThreads.push(new Thread(this.threads[i]));
      }
    }
  }

  channelThreadMessage: FormGroup = this.formBuilder.group({
    channelMessage: '',
  })

  // sendThreadinChannel() {
  //   const message: Message = new Message(this.currentUser, this.channelThreadMessage.value.channelMessage);
  //   const threadMessage = {
  //     id: '',
  //     channelId: this.channelId,
  //     message: message,
  //     timestamp: message.timestamp,
  //   };
  //   console.log('threadMessage:', threadMessage);
  //   // const thread: Thread = new Thread(message)

  //   console.log('Messasge:', message);
  // }

  addEmoji(event: any) {
    console.log('Emoji:', event.emoji.native);
    let textAreaElement = this.threadMessageBox.nativeElement;
    textAreaElement.value += event.emoji.native;
  }

  addUserToMessage(user: any) {
    if (this.threadMessageBox && user) {
      this.threadMessageBox.nativeElement.value += '@' + user.name + ' ';
      this.pingUserControl.setValue('');
      this.menuTrigger.closeMenu();
    }
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.channelSub.unsubscribe();
    this.threadsSub.unsubscribe();
  }

  handleFileInput(event: any) {
    const file: File = event.target.files[0];
    const reader: FileReader = new FileReader();
    this.removeImage();
    reader.onloadend = () => {
      const imgElement = document.createElement('img');
      imgElement.src = reader.result as string;
      imgElement.classList.add('img-file')
      this.imgBox.nativeElement.innerHTML = '';
      this.imgBox.nativeElement.appendChild(imgElement);
      imgElement.addEventListener('click', this.removeImage.bind(this));
    };
    if (file) {
      reader.readAsDataURL(file);
      this.imgFile = file;
      console.log('File is:', this.imgFile);
    }
  }

  removeChatInput() {
    this.channelThreadMessage.reset();
    this.removeImage();
  }

  removeImage() {
    this.imgBox.nativeElement.innerHTML = '';
    this.fileInput.nativeElement.value = '';
    this.imgFile = undefined;
  }
}