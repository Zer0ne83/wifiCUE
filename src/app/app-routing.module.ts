import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeRoutingModule } from './home/home-routing.module';
import { ChildRoutingModule } from './child/child-routing.module';
import { MoreRoutingModule } from './more/more-routing.module';
import { PageNotFoundComponent } from './shared/components';
import { HomeComponent } from './home/home.component';
import { ChildComponent } from './child/child.component';
import { MoreComponent } from './more/more.component';
//////////////////////////////////////////////////
const routes:Routes=[
  {path:'',redirectTo:'home',pathMatch:'full'},
  {path:'**',component:PageNotFoundComponent},
  {path:'home',component:HomeComponent},
  {path:'child',component:ChildComponent},
  {path:'more',component:MoreComponent}
];
//////////////////////////////////////////////////
@NgModule({
  imports:[
    RouterModule.forRoot(routes,{relativeLinkResolution:'legacy',useHash:true}),
    HomeRoutingModule,
    ChildRoutingModule,
    MoreRoutingModule
  ],
  exports:[RouterModule]
})
export class AppRoutingModule{}
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
